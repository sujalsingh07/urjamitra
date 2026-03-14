const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/user');
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

// Create a new listing
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { units, pricePerUnit, location } = req.body;
    
    if (!units || !pricePerUnit || !location?.address) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const listing = await Listing.create({
      seller: req.userId,
      units,
      pricePerUnit,
      location,
      available: true
    });

    // Add listing to user's listings
    await User.findByIdAndUpdate(req.userId, { $push: { listings: listing._id } });

    res.status(201).json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all available listings
router.get('/all', async (req, res) => {
  try {
    const listings = await Listing.find({
      available: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ]
    })
      .populate('seller', 'name email address rating reviewCount')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's own listings
router.get('/my-listings', authenticateToken, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.userId })
      .populate('seller', 'name email address')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get listing by ID
router.get('/:listingId', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId)
      .populate('seller', 'name email address rating reviewCount');
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update listing
router.put('/:listingId', authenticateToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const updated = await Listing.findByIdAndUpdate(
      req.params.listingId,
      req.body,
      { new: true }
    );

    res.json({ success: true, listing: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete listing
router.delete('/:listingId', authenticateToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.listingId);
    await User.findByIdAndUpdate(req.userId, { $pull: { listings: req.params.listingId } });

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;