import { useState, useEffect } from 'react';
import { api } from '../services/api';

function Transactions() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.getMyTransactions();
      if (response.success) {
        // Transform transaction data
        const transformed = response.transactions.map(t => ({
          ...t,
          type: t.transactionType === 'purchase' ? 'bought' : 'sold',
          person: t.transactionType === 'purchase' ? t.seller?.name || 'Unknown' : t.buyer?.name || 'Unknown',
          amount: t.totalAmount,
          time: new Date(t.createdAt).toLocaleDateString(),
          status: t.status
        }));
        setTransactions(transformed);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const totalEarned = transactions
    .filter(t => t.type === 'sold')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'bought')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalUnits = transactions
    .reduce((sum, t) => sum + t.units, 0);

  const filtered = transactions.filter(t => {
    if (filter === 'sold') return t.type === 'sold';
    if (filter === 'bought') return t.type === 'bought';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Transaction History</h1>
        <p className="text-gray-500 text-sm mt-1">All your energy trades</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">⏳ Loading your transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">📭 No transactions yet. Start trading energy!</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
              <div className="text-sm font-medium text-green-100 mb-1">Total Earned</div>
              <div className="text-3xl font-bold">₹{totalEarned}</div>
              <div className="text-xs text-green-200 mt-1">from selling energy ⚡</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
              <div className="text-sm font-medium text-blue-100 mb-1">Total Spent</div>
              <div className="text-3xl font-bold">₹{totalSpent}</div>
              <div className="text-xs text-blue-200 mt-1">on buying energy 🔋</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-5 text-white">
              <div className="text-sm font-medium text-yellow-100 mb-1">Units Traded</div>
              <div className="text-3xl font-bold">{totalUnits} kWh</div>
              <div className="text-xs text-yellow-200 mt-1">total 🌍</div>
            </div>
          </div>

          {/* Net Savings Banner */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your net position this month</p>
              <p className="text-white font-bold text-lg mt-0.5">
                You're ₹{totalEarned - totalSpent} ahead! 🎉
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: '📋 All' },
              { key: 'sold', label: '↗ Sold' },
              { key: 'bought', label: '↙ Bought' },
            ].map((f) => (
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
            <div className="ml-auto">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-yellow-400 transition-all">
                ⬇ Download Report
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((t, index) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-all ${
                  index !== filtered.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                {/* Left side */}
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    t.type === 'sold' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {t.type === 'sold' ? '↗' : '↙'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {t.type === 'sold' ? `Sold to ${t.person}` : `Bought from ${t.person}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.time}</p>
                  </div>
                </div>

                {/* Right side */}
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-400">{t.units} kWh</p>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      t.type === 'sold' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {t.type === 'sold' ? '+' : '-'}₹{t.amount}
                    </p>
                    <p className="text-xs text-gray-400">
                      ✅ {t.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CO2 Impact */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
            <h3 className="font-semibold text-green-800 mb-3">🌍 Your Environmental Impact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {(totalUnits * 0.82).toFixed(1)} kg
                </div>
                <div className="text-xs text-green-600 mt-1">CO₂ Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalUnits} kWh</div>
                <div className="text-xs text-green-600 mt-1">Clean Energy Traded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(totalUnits * 0.82 / 21)} 🌳
                </div>
                <div className="text-xs text-green-600 mt-1">Trees Equivalent</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Transactions;