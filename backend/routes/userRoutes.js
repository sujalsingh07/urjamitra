const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Review = require('../models/Review');
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

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('transactions', 'units totalAmount createdAt transactionType')
      .populate('listings', 'units pricePerUnit available createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('transactions', 'units totalAmount createdAt transactionType')
      .populate('listings', 'units pricePerUnit available createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user reviews
    const reviews = await Review.find({ reviewee: req.userId })
      .populate('reviewer', 'name email');

    res.json({ success: true, user, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, address, totalEnergyGenerated } = req.body;
    
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { name, address, totalEnergyGenerated },
      { new: true }
    ).select('-password');

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add wallet balance
router.post('/add-balance', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { wallet: amount } },
      { new: true }
    ).select('-password');

    res.json({ success: true, user, message: `₹${amount} added to wallet` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Leave a review
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { revieweeId, rating, comment, transactionId } = req.body;

    if (!revieweeId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid review data' });
    }

    // Check if already reviewed in this transaction
    const existingReview = await Review.findOne({
      reviewer: req.userId,
      reviewee: revieweeId,
      transactionId
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already reviewed this transaction' });
    }

    const review = await Review.create({
      reviewer: req.userId,
      reviewee: revieweeId,
      rating,
      comment,
      transactionId
    });

    // Update reviewee's rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      rating: avgRating,
      reviewCount: allReviews.length
    });

    res.status(201).json({ success: true, review, message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user reviews
router.get('/reviews/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name email');

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
