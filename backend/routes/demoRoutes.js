/**
 * Demo Seed Route — POST /api/auth/demo-seed
 *
 * Creates (or resets) two demo users for the hackathon demo:
 *   • Arun Kumar  — prosumer/seller, ₹100 wallet, solar meter at 8 kW
 *   • Lakshmi Rao — consumer/buyer,  ₹500 wallet
 *
 * Also creates a fresh 5 kWh @ ₹5/kWh listing for Arun.
 * Pre-injects DISCOM meter logs so verification passes at any time of day.
 * Idempotent — safe to call multiple times.
 */

const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const User       = require('../models/user');
const Listing    = require('../models/Listing');
const smartMeter = require('../services/smartMeterSimulator');

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  {
    name:        'Arun Kumar',
    email:       'arun@demo.urjamitra',
    address:     '12 Solar Street, Koramangala, Bengaluru',
    wallet:      100,
    isSeller:    true,
    generation:  8,   // kW (forced daytime regardless of clock)
    consumption: 3,   // kW
    location:    { latitude: 12.9352, longitude: 77.6245 },
  },
  {
    name:        'Lakshmi Rao',
    email:       'lakshmi@demo.urjamitra',
    address:     '47 Green Homes, Indiranagar, Bengaluru',
    wallet:      500,
    isSeller:    false,
    generation:  0,
    consumption: 2.5,
    location:    { latitude: 12.9784, longitude: 77.6408 },
  },
];

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/demo-seed', async (req, res) => {
  try {
    const results = [];

    for (const demo of DEMO_USERS) {
      // ── Upsert user ───────────────────────────────────────────────────────
      let user = await User.findOne({ email: demo.email });

      if (user) {
        // Reset to clean demo state
        user.wallet            = demo.wallet;
        user.totalEnergySold   = 0;
        user.totalEnergyBought = 0;
        user.totalEarnings     = 0;
        user.co2Saved          = 0;
        user.location          = demo.location;
        await user.save();
      } else {
        const hashedPw = await bcrypt.hash(DEMO_PASSWORD, 12);
        user = await User.create({
          name:       demo.name,
          email:      demo.email,
          password:   hashedPw,
          address:    demo.address,
          wallet:     demo.wallet,
          location:   demo.location,
        });
      }

      // ── Smart meter setup ─────────────────────────────────────────────────
      const userId  = user._id.toString();
      const meterId = `MTR-${userId.substring(0, 8).toUpperCase()}-99`;

      if (!smartMeter.getMeterState(userId)) {
        smartMeter.registerMeter(userId, meterId, demo.isSeller);
      }
      // Force daytime generation regardless of real clock
      smartMeter.seedMeterForDemo(userId, demo.generation, demo.consumption);

      // ── Pre-inject DISCOM logs ─────────────────────────────────────────────
      // All entries MUST fall within the 15-min verification window.
      // We use 14 min (168 × 5s ticks) to stay safely inside the cutoff.
      // Each entry is scaled so total ≥ 10 kWh, covering any demo trade size.
      if (demo.isSeller && demo.generation > 0) {
        const surplus       = demo.generation - demo.consumption;  // kW
        const windowTicks   = Math.floor(14 * 60 / 5);             // 168
        const naturalPerTick = surplus / 3600 * 5;                 // kWh per 5-s tick
        // Scale up to guarantee ≥ 10 kWh in the window
        const exportPerTick = Math.max(naturalPerTick, 10 / windowTicks);

        const log = smartMeter.meterLogs.get(meterId) || [];
        for (let i = 0; i < windowTicks; i++) {
          log.push({
            timestamp:    new Date(Date.now() - (windowTicks - i) * 5000),
            exportKwh:    +exportPerTick.toFixed(6),
            importKwh:    0,
            netKwh:       +exportPerTick.toFixed(6),
            generationKw:  demo.generation,
            consumptionKw: demo.consumption,
          });
        }
        smartMeter.meterLogs.set(meterId, log);
        const total = +(exportPerTick * windowTicks).toFixed(3);
        console.log(`🔌 DISCOM log ready: ${windowTicks} entries = ${total} kWh in 14-min window for ${meterId}`);
      }

      // ── Build result object ───────────────────────────────────────────────
      const token = createToken(user._id);

      results.push({
        role:     demo.isSeller ? 'seller' : 'buyer',
        name:     user.name,
        email:    demo.email,
        password: DEMO_PASSWORD,
        wallet:   user.wallet,
        meterId,
        token,
        user: {
          _id:      user._id,
          id:       user._id,
          name:     user.name,
          email:    user.email,
          address:  user.address,
          location: user.location,
          wallet:   user.wallet,
        },
      });
    }

    // ── Create Arun's listing ─────────────────────────────────────────────────
    const arunUser = await User.findOne({ email: 'arun@demo.urjamitra' });

    // Remove stale demo listings
    await Listing.deleteMany({ seller: arunUser._id });

    const listing = await Listing.create({
      seller:       arunUser._id,
      units:        5,
      pricePerUnit: 5,
      available:    true,
      location: {
        address:   arunUser.address,
        latitude:  arunUser.location.latitude,
        longitude: arunUser.location.longitude,
      },
    });

    await User.findByIdAndUpdate(arunUser._id, { $set: { listings: [listing._id] } });

    console.log('✅ Demo seed complete — Arun + Lakshmi ready');

    res.json({
      success: true,
      message: 'Demo accounts ready!',
      users:   results,
      listing: {
        _id:          listing._id,
        units:        listing.units,
        pricePerUnit: listing.pricePerUnit,
        sellerName:   'Arun Kumar',
      },
      instructions: [
        '1. Open Tab A → click "Login as Arun (Seller)"',
        '2. Open Tab B → click "Login as Lakshmi (Buyer)"',
        '3. In Tab B   → Sidebar → P2P Trade → buy from Arun',
        '4. In Tab A   → approve the DEPA consent modal',
        '5. Watch IES console settle the trade live!',
      ],
    });
  } catch (err) {
    console.error('Demo seed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
