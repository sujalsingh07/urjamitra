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

const normalizeAddressPart = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getCityAndArea = (address) => {
  const parts = String(address || '')
    .split(',')
    .map((p) => normalizeAddressPart(p))
    .filter(Boolean);

  return {
    area: parts[0] || '',
    city: parts[parts.length - 1] || '',
  };
};

const isSameCityOrArea = (userAddress, listingAddress) => {
  const user = getCityAndArea(userAddress);
  const listing = getCityAndArea(listingAddress);

  if (!user.city && !user.area) return false;
  if (!listing.city && !listing.area) return false;

  return (user.city && listing.city && user.city === listing.city) ||
    (user.area && listing.area && user.area === listing.area);
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

    const io = req.app.get('io');
    if (io) {
      io.emit('listing:changed', { type: 'created', listingId: String(listing._id) });
    }

    res.status(201).json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all available listings in the user's city/area
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('address');
    if (!currentUser?.address) {
      return res.json({
        success: true,
        listings: [],
        message: 'Please add your address in profile to view local listings.'
      });
    }

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

    const localListings = listings.filter((listing) =>
      isSameCityOrArea(currentUser.address, listing?.location?.address || listing?.seller?.address)
    );
    
    res.json({ success: true, listings: localListings });
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

    const io = req.app.get('io');
    if (io) {
      io.emit('listing:changed', { type: 'updated', listingId: String(updated._id) });
    }

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

    const io = req.app.get('io');
    if (io) {
      io.emit('listing:changed', { type: 'deleted', listingId: String(req.params.listingId) });
    }

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;