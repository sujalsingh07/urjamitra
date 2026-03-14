const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
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
    const { name, mobile, address, totalEnergyGenerated, location } = req.body;

    if (!name || !mobile || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
    }

    const updatePayload = {
      name,
      mobile,
      address,
      totalEnergyGenerated,
    };

    if (
      location &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
    ) {
      updatePayload.location = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }
    
    const updated = await User.findByIdAndUpdate(
      req.userId,
      updatePayload,
      { new: true, runValidators: true }
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

// Get community stats for dashboard widgets
router.get('/community-stats', authenticateToken, async (req, res) => {
  try {
    const [users, completedTransactions, recentListings, currentUser] = await Promise.all([
      User.find({}, '_id totalEarnings co2Saved totalEnergyShared'),
      Transaction.find({ status: 'completed' }, 'units totalAmount seller createdAt'),
      Listing.find({}, 'units createdAt'),
      User.findById(req.userId, '_id totalEarnings co2Saved totalEnergyShared'),
    ]);

    const allUsers = [...users];
    if (currentUser) {
      const meId = String(currentUser._id || '');
      const alreadyIncluded = allUsers.some((u) => String(u._id || '') === meId);
      if (!alreadyIncluded) {
        allUsers.push(currentUser);
      }
    }

    const monthlyGoal = 20000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = completedTransactions.filter(
      (tx) => new Date(tx.createdAt) >= startOfMonth
    );

    const monthlySavings = monthTransactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount || 0),
      0
    );

    const totalSharedKwh = completedTransactions.reduce(
      (sum, tx) => sum + Number(tx.units || 0),
      0
    );

    const activeHomes = new Set(
      completedTransactions
        .map((tx) => String(tx.seller || ''))
        .filter(Boolean)
    ).size;

    const totalCo2Saved = allUsers.reduce(
      (sum, user) => {
        const userCo2 = Number(user.co2Saved || 0);
        const userShared = Number(user.totalEnergyShared || 0);
        return sum + (userCo2 > 0 ? userCo2 : userShared * 0.82);
      },
      0
    );

    const totalCommunityEarnings = allUsers.reduce(
      (sum, user) => sum + Number(user.totalEarnings || 0),
      0
    );

    const rankedUsersByCo2 = allUsers
      .map((user) => ({
        id: String(user._id || ''),
        co2Saved: Number(user.co2Saved || 0) > 0
          ? Number(user.co2Saved || 0)
          : Number(user.totalEnergyShared || 0) * 0.82,
      }))
      .sort((a, b) => b.co2Saved - a.co2Saved);

    const currentUserId = String(req.userId || '');
    const currentRankIndex = rankedUsersByCo2.findIndex((u) => u.id === currentUserId);
    const rawCommunitySize = rankedUsersByCo2.length;
    const communitySize = rawCommunitySize > 0
      ? rawCommunitySize
      : (currentUser ? 1 : 0);
    const rawRank = currentRankIndex >= 0
      ? currentRankIndex + 1
      : (communitySize > 0 ? communitySize : null);
    const communityRank = Number.isFinite(Number(rawRank)) && Number(rawRank) > 0
      ? Number(rawRank)
      : (communitySize > 0 ? 1 : null);

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekly = [];

    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const generated = recentListings
        .filter((listing) => {
          const createdAt = new Date(listing.createdAt);
          return createdAt >= dayStart && createdAt < dayEnd;
        })
        .reduce((sum, listing) => sum + Number(listing.units || 0), 0);

      const shared = completedTransactions
        .filter((tx) => {
          const createdAt = new Date(tx.createdAt);
          return createdAt >= dayStart && createdAt < dayEnd;
        })
        .reduce((sum, tx) => sum + Number(tx.units || 0), 0);

      weekly.push({
        d: days[dayStart.getDay()],
        g: Number(generated.toFixed(1)),
        s: Number(shared.toFixed(1)),
      });
    }

    res.json({
      success: true,
      stats: {
        monthlyGoal,
        monthlySavings: Number(monthlySavings.toFixed(2)),
        totalSharedKwh: Number(totalSharedKwh.toFixed(1)),
        activeHomes,
        totalCo2Saved: Number(totalCo2Saved.toFixed(1)),
        totalCommunityEarnings: Number(totalCommunityEarnings.toFixed(2)),
        communityRank,
        communitySize,
        weekly,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
