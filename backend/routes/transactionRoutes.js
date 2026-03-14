const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/user');
const Listing = require('../models/Listing');
const jwt = require('jsonwebtoken');

const RESERVATION_TTL_MINUTES = 10;
const CO2_PER_KWH = 0.82;

const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

const finalizeListingAvailability = async (listingId) => {
  const listing = await Listing.findById(listingId).select('units');
  if (!listing) return;
  await Listing.findByIdAndUpdate(listingId, { available: listing.units > 0 });
};

const refundBuyerAndRestoreListing = async (transaction, reason) => {
  await User.findByIdAndUpdate(transaction.buyer, {
    $inc: {
      wallet: Number(transaction.holdAmount || transaction.grossAmount || transaction.totalAmount || 0),
      totalEnergyBought: -Number(transaction.reservedUnits || transaction.units || 0)
    }
  });

  await Listing.findByIdAndUpdate(transaction.listing, {
    $inc: { units: Number(transaction.reservedUnits || transaction.units || 0) }
  });

  await finalizeListingAvailability(transaction.listing);

  const nextStatus = reason === 'expired' ? 'expired' : 'refunded';
  transaction.status = nextStatus;
  transaction.statusReason = reason || '';
  transaction.cancelledAt = new Date();
  transaction.holdAmount = 0;
  await transaction.save();
};

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Create a transaction (purchase)
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { listingId, units } = req.body;
    const buyer = req.userId;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (units > listing.units) {
      return res.status(400).json({ success: false, message: 'Insufficient energy available' });
    }

    const totalAmount = units * listing.pricePerUnit;
    const buyerData = await User.findById(buyer);

    if (buyerData.wallet < totalAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      seller: listing.seller,
      buyer: buyer,
      listing: listingId,
      units,
      pricePerUnit: listing.pricePerUnit,
      totalAmount,
      status: 'completed',
      transactionType: 'purchase'
    });

    // Update buyer wallet
    await User.findByIdAndUpdate(buyer, {
      $inc: { wallet: -totalAmount, totalEnergyBought: units },
      $push: { transactions: transaction._id }
    });

    // Update seller wallet and stats
    await User.findByIdAndUpdate(listing.seller, {
      $inc: {
        wallet: totalAmount,
        totalEnergySold: units,
        totalEarnings: totalAmount,
        totalEnergyShared: units,
        co2Saved: Number((units * CO2_PER_KWH).toFixed(2))
      },
      $push: { transactions: transaction._id }
    });

    // Update listing
    const newUnits = listing.units - units;
    if (newUnits <= 0) {
      await Listing.findByIdAndUpdate(listingId, { available: false });
    } else {
      await Listing.findByIdAndUpdate(listingId, { units: newUnits });
    }

    res.status(201).json({ 
      success: true, 
      transaction,
      message: `Successfully purchased ${units} kWh for ₹${totalAmount}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Phase 1: Create order request with reservation
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { listingId, units } = req.body;

    if (!listingId || !isPositiveNumber(units)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'listingId and positive units are required'
      });
    }

    const requestedUnits = Number(units);

    const listing = await Listing.findOneAndUpdate(
      {
        _id: listingId,
        available: true,
        units: { $gte: requestedUnits }
      },
      {
        $inc: { units: -requestedUnits }
      },
      {
        new: true
      }
    );

    if (!listing) {
      return res.status(409).json({
        success: false,
        code: 'LISTING_UNAVAILABLE',
        message: 'Listing is unavailable or does not have enough units'
      });
    }

    if (String(listing.seller) === String(req.userId)) {
      await Listing.findByIdAndUpdate(listingId, { $inc: { units: requestedUnits } });
      await finalizeListingAvailability(listingId);
      return res.status(400).json({
        success: false,
        code: 'FORBIDDEN_ACTION',
        message: 'You cannot purchase your own listing'
      });
    }

    const grossAmount = requestedUnits * Number(listing.pricePerUnit);
    const buyer = await User.findById(req.userId).select('wallet');

    if (!buyer || Number(buyer.wallet) < grossAmount) {
      await Listing.findByIdAndUpdate(listingId, { $inc: { units: requestedUnits } });
      await finalizeListingAvailability(listingId);
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_WALLET',
        message: 'Wallet balance is insufficient for reservation'
      });
    }

    const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        wallet: -grossAmount,
        totalEnergyBought: requestedUnits
      }
    });

    const transaction = await Transaction.create({
      seller: listing.seller,
      buyer: req.userId,
      listing: listingId,
      units: requestedUnits,
      requestedUnits,
      reservedUnits: requestedUnits,
      deliveredUnits: 0,
      pricePerUnit: Number(listing.pricePerUnit),
      pricePerUnitLocked: Number(listing.pricePerUnit),
      totalAmount: grossAmount,
      grossAmount,
      platformFee: 0,
      netAmount: grossAmount,
      holdAmount: grossAmount,
      reservationExpiresAt,
      status: 'reserved',
      transactionType: 'purchase'
    });

    await User.findByIdAndUpdate(req.userId, {
      $push: { transactions: transaction._id }
    });

    await User.findByIdAndUpdate(listing.seller, {
      $push: { transactions: transaction._id }
    });

    await finalizeListingAvailability(listingId);

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        requestedUnits: transaction.requestedUnits,
        reservedUnits: transaction.reservedUnits,
        pricePerUnitLocked: transaction.pricePerUnitLocked,
        grossAmount: transaction.grossAmount,
        reservationExpiresAt: transaction.reservationExpiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Phase 1: Seller accepts or rejects reserved order
router.post('/:transactionId/seller-decision', authenticateToken, async (req, res) => {
  try {
    const { decision, reason } = req.body;
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (String(transaction.seller) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ACTION',
        message: 'Only seller can take this action'
      });
    }

    if (transaction.status !== 'reserved') {
      return res.status(409).json({
        success: false,
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot apply seller decision from ${transaction.status}`
      });
    }

    if (transaction.reservationExpiresAt && new Date(transaction.reservationExpiresAt) < new Date()) {
      await refundBuyerAndRestoreListing(transaction, 'expired');
      return res.status(409).json({
        success: false,
        code: 'RESERVATION_EXPIRED',
        message: 'Reservation already expired'
      });
    }

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'decision must be accept or reject'
      });
    }

    if (decision === 'reject') {
      await refundBuyerAndRestoreListing(transaction, reason || 'seller_rejected');
      transaction.status = 'seller_rejected';
      transaction.statusReason = reason || 'Rejected by seller';
      await transaction.save();

      return res.json({
        success: true,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          reason: transaction.statusReason
        }
      });
    }

    transaction.status = 'seller_accepted';
    transaction.acceptedAt = new Date();
    transaction.statusReason = '';
    await transaction.save();

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        acceptedAt: transaction.acceptedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Phase 1: Complete transaction and settle funds to seller
router.post('/:transactionId/complete', authenticateToken, async (req, res) => {
  try {
    const { deliveredUnits, proof } = req.body;
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (String(transaction.seller) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ACTION',
        message: 'Only seller can complete this transaction'
      });
    }

    if (!['seller_accepted', 'in_delivery'].includes(transaction.status)) {
      return res.status(409).json({
        success: false,
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot complete from ${transaction.status}`
      });
    }

    const delivered = isPositiveNumber(deliveredUnits)
      ? Number(deliveredUnits)
      : Number(transaction.reservedUnits || transaction.units || 0);

    const reserved = Number(transaction.reservedUnits || transaction.units || 0);

    if (delivered > reserved) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'deliveredUnits cannot exceed reservedUnits'
      });
    }

    const lockedPrice = Number(transaction.pricePerUnitLocked || transaction.pricePerUnit || 0);
    const grossAmount = Number((delivered * lockedPrice).toFixed(2));
    const heldAmount = Number(transaction.holdAmount || transaction.grossAmount || transaction.totalAmount || 0);

    await User.findByIdAndUpdate(transaction.seller, {
      $inc: {
        wallet: grossAmount,
        totalEnergySold: delivered,
        totalEarnings: grossAmount,
        totalEnergyShared: delivered,
        co2Saved: Number((delivered * CO2_PER_KWH).toFixed(2))
      }
    });

    const refundAmount = Number((heldAmount - grossAmount).toFixed(2));
    if (refundAmount > 0) {
      await User.findByIdAndUpdate(transaction.buyer, {
        $inc: {
          wallet: refundAmount,
          totalEnergyBought: -Number((reserved - delivered).toFixed(2))
        }
      });

      await Listing.findByIdAndUpdate(transaction.listing, {
        $inc: { units: Number((reserved - delivered).toFixed(2)) }
      });

      await finalizeListingAvailability(transaction.listing);
    }

    transaction.status = 'completed';
    transaction.deliveredUnits = delivered;
    transaction.deliveredAt = new Date();
    transaction.settledAt = new Date();
    transaction.totalAmount = grossAmount;
    transaction.grossAmount = grossAmount;
    transaction.netAmount = grossAmount;
    transaction.holdAmount = 0;
    transaction.statusReason = proof?.note || '';
    await transaction.save();

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        deliveredUnits: transaction.deliveredUnits,
        settledAt: transaction.settledAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Phase 1: Unified transactions endpoint
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { role = 'all', status, page = 1, limit = 20 } = req.query;
    const pageNo = Math.max(1, Number(page) || 1);
    const limitNo = Math.min(100, Math.max(1, Number(limit) || 20));

    const roleQuery = role === 'buyer'
      ? { buyer: req.userId }
      : role === 'seller'
        ? { seller: req.userId }
        : { $or: [{ buyer: req.userId }, { seller: req.userId }] };

    const statusQuery = status ? { status } : {};
    const query = { ...roleQuery, ...statusQuery };

    const [items, total] = await Promise.all([
      Transaction.find(query)
        .populate('seller', 'name email address')
        .populate('buyer', 'name email address')
        .populate('listing')
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * limitNo)
        .limit(limitNo),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      items,
      page: pageNo,
      limit: limitNo,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
  try {
    const buyerTransactions = await Transaction.find({ buyer: req.userId })
      .populate('seller', 'name email address')
      .populate('listing')
      .sort({ createdAt: -1 });

    const sellerTransactions = await Transaction.find({ seller: req.userId })
      .populate('buyer', 'name email address')
      .populate('listing')
      .sort({ createdAt: -1 });

    const allTransactions = [...buyerTransactions, ...sellerTransactions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, transactions: allTransactions });
  } catch (error) {
    console.error("Error in /my-transactions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all transactions history
router.get('/all', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('seller', 'name email')
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('seller', 'name email address')
      .populate('buyer', 'name email address')
      .populate('listing');
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;