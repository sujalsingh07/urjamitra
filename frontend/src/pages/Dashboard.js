import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CampusMap from "../components/CampusMap";

const stats = [
  { label: 'Energy Generated', value: '12.4 kWh', icon: '☀️', color: 'bg-yellow-50 border-yellow-200' },
  { label: 'Energy Shared', value: '8.2 kWh', icon: '⚡', color: 'bg-green-50 border-green-200' },
  { label: 'Money Earned', value: '₹164', icon: '💰', color: 'bg-blue-50 border-blue-200' },
  { label: 'CO₂ Saved', value: '6.5 kg', icon: '🌍', color: 'bg-purple-50 border-purple-200' },
];

const recentActivity = [
  { type: 'sold', desc: 'Sold 2 kWh to House #14B', time: 'Today, 9:12 AM', amount: '+₹36' },
  { type: 'bought', desc: 'Bought 1 kWh from Sunita', time: 'Yesterday, 6:45 PM', amount: '-₹18' },
  { type: 'sold', desc: 'Sold 3 kWh to Flat 4B', time: 'Yesterday, 2:30 PM', amount: '+₹54' },
  { type: 'bought', desc: 'Bought 2 kWh from Anil', time: '2 days ago', amount: '-₹32' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [listing, setListing] = useState({ units: '', price: '' });
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Good morning, {user.name}! ☀️
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tuesday, 10 March 2026 • Pune, Maharashtra
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`border-2 rounded-xl p-4 ${stat.color}`}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Community Savings Meter */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">🌍 Community Savings Meter</h2>
            <p className="text-green-100 text-sm">Your neighborhood this month</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">₹14,820</div>
            <div className="text-green-100 text-sm">collective savings</div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="bg-green-400 rounded-full h-4 mb-2">
          <div
            className="bg-white rounded-full h-4 transition-all"
            style={{ width: '74%' }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-green-100">
          <span>74% of monthly goal reached</span>
          <span>Goal: ₹20,000</span>
        </div>
        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-400">
          <div className="text-center">
            <div className="font-bold text-lg">48</div>
            <div className="text-xs text-green-100">Homes Connected</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">284 kWh</div>
            <div className="text-xs text-green-100">Energy Shared</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">186 kg</div>
            <div className="text-xs text-green-100">CO₂ Reduced</div>
          </div>
        </div>
      </div>

      {/* Community Energy Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-4">📍 Community Energy Map</h2>
        <CampusMap />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <span className="text-xl">⚡</span>
          List My Surplus Energy
        </button>
        <button
          onClick={() => navigate('/marketplace')}
          className="bg-white border-2 border-gray-200 hover:border-yellow-400 text-gray-700 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <span className="text-xl">🏪</span>
          Browse Marketplace
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-4">📋 Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  item.type === 'sold' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {item.type === 'sold' ? '↗' : '↙'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.desc}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${
                item.type === 'sold' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* List Energy Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">⚡ List Your Surplus Energy</h2>
            <p className="text-gray-500 text-sm mb-6">Your neighbors will see this listing immediately</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  How much energy? (kWh)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  onChange={(e) => setListing({ ...listing, units: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Your price per kWh (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  onChange={(e) => setListing({ ...listing, price: e.target.value })}
                />
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  💡 Average price in your area: ₹16-20/kWh
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate('/marketplace');
                }}
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

export default Dashboard;