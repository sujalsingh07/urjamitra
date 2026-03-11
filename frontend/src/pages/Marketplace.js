import { useState, useEffect } from 'react';
import { api } from '../services/api';

function Marketplace() {
  const [filter, setFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listingForm, setListingForm] = useState({ units: '', pricePerUnit: '', address: '' });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.getListings();
      if (response.success) {
        setListings(response.listings);
      } else {
        setError(response.message || 'Failed to fetch listings');
      }
    } catch (err) {
      setError('Error fetching listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    try {
      if (!listingForm.units || !listingForm.pricePerUnit || !listingForm.address) {
        setError('Please fill all fields');
        return;
      }
      const response = await api.createListing({
        units: parseFloat(listingForm.units),
        pricePerUnit: parseFloat(listingForm.pricePerUnit),
        location: { address: listingForm.address }
      });
      if (response.success) {
        setShowListModal(false);
        setListingForm({ units: '', pricePerUnit: '', address: '' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchListings();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error creating listing');
    }
  };

  const handlePurchase = async (listingId) => {
    try {
      // In a real scenario, ask for units to purchase
      const unitsStr = prompt('How many kWh do you want to purchase?');
      if (!unitsStr) return;
      
      const units = parseFloat(unitsStr);
      const response = await api.purchaseEnergy(listingId, units);
      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchListings();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error purchasing energy');
    }
  };

  const filters = [
    { key: 'all', label: 'All Listings' },
    { key: 'available', label: 'Available Now' },
    { key: 'cheap', label: 'Cheapest First' },
  ];

  const filtered = listings
    .filter(l => filter === 'available' ? l.available : true)
    .sort((a, b) => filter === 'cheap' ? a.pricePerUnit - b.pricePerUnit : 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⚡ Energy Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.filter(l => l.available).length} listings available near you
          </p>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
        >
          <span>+</span> List My Energy
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-yellow-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="bg-green-500 text-white rounded-xl px-5 py-3 mb-4 flex items-center gap-2">
          ✅ Energy purchase successful!
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">⏳ Loading energy listings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">📭 No listings available. Create one to earn!</p>
        </div>
      ) : (
        <>
          {/* Listings */}
          <div className="space-y-4">
        {filtered.map((listing) => (
          <div
            key={listing._id}
            className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
              listing.available ? 'border-gray-100 hover:border-yellow-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {listing.seller?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{listing.seller?.name || 'Unknown'}</h3>
                    <span className="text-xs text-gray-400">⭐ {(listing.seller?.rating || 5).toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-500">📍 {listing.location?.address || 'Location TBD'}</p>
                  <p className="text-xs text-gray-400 mt-1">⏰ Listed on {new Date(listing.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  ₹{listing.pricePerUnit}
                  <span className="text-sm font-normal text-gray-400">/kWh</span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {listing.units} kWh available
                </div>
                {listing.available ? (
                  <button
                    onClick={() => handlePurchase(listing._id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all"
                  >
                    Buy Energy ⚡
                  </button>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="flex gap-4">
                <span className="text-xs text-gray-400">
                  💰 Total: ₹{listing.units * listing.price}
                </span>
                <span className="text-xs text-gray-400">
                  🌍 Saves {(listing.units * 0.8).toFixed(1)} kg CO₂
                </span>
              </div>
              {listing.available && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                  ● Available Now
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {/* List Energy Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-1">⚡ List Your Energy</h2>
            <p className="text-gray-500 text-sm mb-5">Neighbors nearby will see your listing</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Units available (kWh)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  value={listingForm.units}
                  onChange={(e) => setListingForm({ ...listingForm, units: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Price per kWh (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  value={listingForm.pricePerUnit}
                  onChange={(e) => setListingForm({ ...listingForm, pricePerUnit: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Your Address</label>
                <input
                  type="text"
                  placeholder="e.g. House #7, Maple Lane"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  value={listingForm.address}
                  onChange={(e) => setListingForm({ ...listingForm, address: e.target.value })}
                />
              </div>
              {listingForm.units && listingForm.pricePerUnit && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-700 font-medium">
                    💰 You'll earn ₹{(parseFloat(listingForm.units) * parseFloat(listingForm.pricePerUnit)).toFixed(2)} if fully sold
                  </p>
                </div>
              )}
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  💡 Avg price in your area: ₹16-20/kWh
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowListModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateListing}
                className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600"
              >
                Post Listing ⚡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Marketplace;