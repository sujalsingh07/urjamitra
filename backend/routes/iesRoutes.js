const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const ies = require('../services/iesSimulator');
const smartMeter = require('../services/smartMeterSimulator');

// Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Inject io into routes
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

/**
 * GET /api/ies/identity
 * Get or create IES ID for current user
 */
router.get('/identity', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const iesId = ies.getOrCreateIESId(req.userId, user.name);
    const meterState = smartMeter.getMeterState(req.userId);

    res.json({
      success: true,
      iesId,
      meterId: meterState?.meterId || `MTR-${req.userId.toString().substring(0, 8).toUpperCase()}`,
      verified: true,
      aadhaarLinked: true
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/ies/register-meter
 * Register smart meter for a user (called on login)
 */
router.post('/register-meter', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name');
    const meterId = `MTR-${req.userId.toString().substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
    
    // Determine if user is a seller (has listings)
    const listingCount = await Listing.countDocuments({ seller: req.userId, available: true });
    const isSeller = listingCount > 0;

    smartMeter.registerMeter(req.userId.toString(), meterId, isSeller);
    const meterState = smartMeter.getMeterState(req.userId.toString());

    res.json({ success: true, meterId, meterState });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/ies/telemetry
 * Get current meter telemetry for the authenticated user
 */
router.get('/telemetry', authenticateToken, (req, res) => {
  const state = smartMeter.getMeterState(req.userId.toString());
  
  if (!state) {
    // Auto-register if not found
    const meterId = `MTR-${req.userId.toString().substring(0, 8).toUpperCase()}-99`;
    smartMeter.registerMeter(req.userId.toString(), meterId, false);
    return res.json({ success: true, meterState: smartMeter.getMeterState(req.userId.toString()) });
  }

  res.json({ success: true, meterState: state });
});

/**
 * GET /api/ies/telemetry/all
 * Get all meter states (for community map)
 */
router.get('/telemetry/all', authenticateToken, (req, res) => {
  res.json({ success: true, meters: smartMeter.getAllMeterStates() });
});

/**
 * POST /api/ies/trade/initiate
 * Phase 1: Buyer initiates a P2P trade — triggers consent request to seller
 */
router.post('/trade/initiate', authenticateToken, async (req, res) => {
  try {
    const { listingId, units } = req.body;
    const buyerId = req.userId;

    if (!listingId || !units || units <= 0) {
      return res.status(400).json({ success: false, message: 'listingId and units required' });
    }

    const listing = await Listing.findById(listingId).populate('seller', 'name email');
    if (!listing || !listing.available) {
      return res.status(404).json({ success: false, message: 'Listing not found or unavailable' });
    }

    if (listing.units < units) {
      return res.status(400).json({ success: false, message: `Only ${listing.units} kWh available` });
    }

    const sellerId = listing.seller._id;

    if (sellerId.toString() === buyerId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot buy your own listing' });
    }

    // Check buyer wallet
    const buyer = await User.findById(buyerId).select('wallet name');
    const totalCost = units * listing.pricePerUnit;
    if (buyer.wallet < totalCost) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Need ₹${totalCost}, have ₹${buyer.wallet}` });
    }

    // Create a pending transaction
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Auto-register meters if not already
    const sellerMeterState = smartMeter.getMeterState(sellerId.toString());
    if (!sellerMeterState) {
      const meterId = `MTR-${sellerId.toString().substring(0, 8).toUpperCase()}-99`;
      smartMeter.registerMeter(sellerId.toString(), meterId, true);
    }

    // Initiate IES consent flow
    const { consentId, tradeRecord } = ies.initiateTradeRequest(
      tradeId, sellerId, buyerId, units, listingId, req.io
    );

    // Log IES message to buyer's socket room
    if (req.io) {
      req.io.to(`user:${buyerId}`).emit('ies:log', {
        tradeId,
        logs: [
          { time: new Date().toISOString(), event: `[IES] Received Trade Request: ${listing.seller.name} → ${buyer.name} (${units} Units)`, level: 'info' },
          { time: new Date().toISOString(), event: `[IES] Requesting Data Consent from ${listing.seller.name}...`, level: 'info' }
        ]
      });
    }

    res.json({
      success: true,
      tradeId,
      consentId,
      sellerId: sellerId.toString(),
      sellerName: listing.seller.name,
      units,
      pricePerUnit: listing.pricePerUnit,
      totalCost,
      message: `Trade request sent. Waiting for ${listing.seller.name} to approve...`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/ies/consent/:consentId/approve
 * Phase 2: Seller approves or rejects consent
 */
router.post('/consent/:consentId/approve', authenticateToken, async (req, res) => {
  try {
    const { consentId } = req.params;
    const { decision } = req.body; // 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be approve or reject' });
    }

    const result = await ies.processConsent(consentId, req.userId, decision === 'approve' ? 'approve' : 'reject', req.io);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // If approved, trigger DISCOM verification
    if (decision === 'approve') {
      const consent = ies.consentStore.get(consentId);
      
      setTimeout(async () => {
        try {
          // Phase 3: Verify DISCOM logs
          const verifyResult = ies.verifyDISCOMlogs(
            consent.tradeId,
            req.userId,
            consent.units,
            req.io
          );

          if (verifyResult.success) {
            // Phase 4: Complete transaction in DB and settle funds
            await settleTradeInDB(consent.tradeId, consent, req.io);
          }
        } catch (e) {
          console.error('DISCOM verification error:', e);
        }
      }, 2000); // 2 second delay to simulate DISCOM check
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/ies/pending-consents
 * Seller: get pending consent requests
 */
router.get('/pending-consents', authenticateToken, (req, res) => {
  const pending = ies.getPendingConsentsForSeller(req.userId);
  res.json({ success: true, consents: pending });
});

/**
 * GET /api/ies/trade/:tradeId/status
 * Get trade status and IES logs
 */
router.get('/trade/:tradeId/status', authenticateToken, (req, res) => {
  const trade = ies.getTradeStatus(req.params.tradeId);
  if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
  res.json({ success: true, trade });
});

/**
 * Internal: Settle trade in MongoDB and emit result
 */
async function settleTradeInDB(tradeId, consent, io) {
  try {
    const listing = await Listing.findById(consent.listingId);
    if (!listing) return;

    const units = consent.units;
    const totalAmount = +(units * listing.pricePerUnit).toFixed(2);
    const CO2_PER_KWH = 0.82;

    // Create transaction record
    const transaction = await Transaction.create({
      seller: consent.sellerId,
      buyer: consent.buyerId,
      listing: consent.listingId,
      units,
      pricePerUnit: listing.pricePerUnit,
      totalAmount,
      grossAmount: totalAmount,
      netAmount: totalAmount,
      holdAmount: 0,
      status: 'completed',
      transactionType: 'purchase',
      deliveredUnits: units,
      deliveredAt: new Date(),
      settledAt: new Date(),
      statusReason: `IES Trade: ${tradeId}`
    });

    // Update buyer: deduct wallet
    await User.findByIdAndUpdate(consent.buyerId, {
      $inc: { wallet: -totalAmount, totalEnergyBought: units },
      $push: { transactions: transaction._id }
    });

    // Update seller: add wallet + stats
    await User.findByIdAndUpdate(consent.sellerId, {
      $inc: {
        wallet: totalAmount,
        totalEnergySold: units,
        totalEarnings: totalAmount,
        totalEnergyShared: units,
        co2Saved: +(units * CO2_PER_KWH).toFixed(2)
      },
      $push: { transactions: transaction._id }
    });

    // Update listing units
    const newUnits = listing.units - units;
    await Listing.findByIdAndUpdate(consent.listingId, {
      units: Math.max(0, newUnits),
      available: newUnits > 0
    });

    // Fetch updated balances
    const [sellerUser, buyerUser] = await Promise.all([
      User.findById(consent.sellerId).select('wallet name'),
      User.findById(consent.buyerId).select('wallet name')
    ]);

    // Complete IES flow
    const { txnHash, logs } = ies.completeTrade(
      tradeId, units, totalAmount, consent.sellerId, consent.buyerId, io
    );

    // Emit final settlement to both parties
    if (io) {
      const receipt = {
        tradeId,
        txnHash,
        transactionId: transaction._id,
        units,
        pricePerUnit: listing.pricePerUnit,
        totalAmount,
        sellerNewWallet: sellerUser?.wallet,
        buyerNewWallet: buyerUser?.wallet,
        logs,
        timestamp: new Date().toISOString()
      };
      io.to(`user:${consent.sellerId}`).emit('ies:settlement', receipt);
      io.to(`user:${consent.buyerId}`).emit('ies:settlement', receipt);
    }

    console.log(`✅ IES Trade ${tradeId} settled. TXN: ${transaction._id}`);
  } catch (err) {
    console.error('Trade settlement error:', err);
  }
}

module.exports = router;
