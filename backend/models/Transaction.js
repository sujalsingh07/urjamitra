const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  units: {
    type: Number,
    required: true,
    min: 0.1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  requestedUnits: {
    type: Number,
    min: 0.1
  },
  reservedUnits: {
    type: Number,
    min: 0.1
  },
  deliveredUnits: {
    type: Number,
    min: 0
  },
  pricePerUnitLocked: {
    type: Number,
    min: 0
  },
  grossAmount: {
    type: Number,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    min: 0
  },
  holdAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'pending',
      'pending_request',
      'reserved',
      'seller_accepted',
      'seller_rejected',
      'in_delivery',
      'completed',
      'cancelled',
      'disputed',
      'refunded',
      'expired'
    ],
    default: 'completed'
  },
  statusReason: {
    type: String,
    default: ''
  },
  reservationExpiresAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  settledAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  disputedAt: {
    type: Date
  },
  transactionType: {
    type: String,
    enum: ['purchase', 'sale'],
    default: 'purchase'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Transaction', transactionSchema);
