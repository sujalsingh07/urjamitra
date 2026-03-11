const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/user');
const Listing = require('../models/Listing');
const jwt = require('jsonwebtoken');

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
      $inc: { wallet: totalAmount, totalEnergySold: units, totalEarnings: totalAmount },
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