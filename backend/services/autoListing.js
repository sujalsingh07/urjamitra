// backend/services/autoListing.js
// Automatically creates a listing for users with surplus energy

const Listing = require('../models/Listing');
const User = require('../models/user');

async function autoCreateListing(userId, surplusKw, userLocation) {
  if (!userId || surplusKw <= 0) return;

  // Check if user already has an available listing
  const existing = await Listing.findOne({ seller: userId, available: true });
  if (existing) return;

  // Use a default price or fetch from user profile/settings
  const pricePerUnit = 5; // ₹5/kWh default
  const units = Math.floor(surplusKw); // Only list whole kWh units
  if (units <= 0) return;

  // Use user's location if available
  const location = userLocation && userLocation.latitude && userLocation.longitude
    ? { address: userLocation.address || '', latitude: userLocation.latitude, longitude: userLocation.longitude }
    : { address: userLocation?.address || '' };

  const listing = await Listing.create({
    seller: userId,
    units,
    pricePerUnit,
    location,
    available: true
  });

  // Add listing to user's listings
  await User.findByIdAndUpdate(userId, { $push: { listings: listing._id } });
}

module.exports = { autoCreateListing };
