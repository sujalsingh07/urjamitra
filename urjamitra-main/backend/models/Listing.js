const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 0.1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
});

module.exports = mongoose.model('Listing', listingSchema);
