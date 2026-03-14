const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  mobile: {
    type: String,
    default: '',
    validate: {
      validator: (value) => value === '' || /^\d{10}$/.test(value),
      message: 'Mobile number must be exactly 10 digits'
    }
  },
  address: { type: String, required: true },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  wallet: { type: Number, default: 0 }, // Balance in rupees
  totalEnergyGenerated: { type: Number, default: 0 }, // in kWh
  totalEnergyShared: { type: Number, default: 0 }, // in kWh
  totalEnergySold: { type: Number, default: 0 }, // in kWh
  totalEnergyBought: { type: Number, default: 0 }, // in kWh
  totalEarnings: { type: Number, default: 0 }, // in rupees
  rating: { type: Number, default: 5, min: 1, max: 5 },
  reviewCount: { type: Number, default: 0 },
  co2Saved: { type: Number, default: 0 }, // in kg
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function(entered, stored) {
  return await bcrypt.compare(entered, stored);
};

module.exports = mongoose.model('User', userSchema);
