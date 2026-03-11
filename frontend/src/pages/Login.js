import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    address: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Choose endpoint based on login or signup
      const endpoint = isLogin
        ? 'http://localhost:5001/api/auth/login'
        : 'http://localhost:5001/api/auth/signup';

      // Send data to backend
      const response = await axios.post(endpoint, form);

      if (response.data.success) {
        // Save token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Go to dashboard
        navigate('/dashboard');
      }

    } catch (err) {
      // Show error message from backend
      setError(
        err.response?.data?.message || 
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚡</div>
          <h1 className="text-3xl font-bold text-gray-800">Urjamitra</h1>
          <p className="text-yellow-600 font-medium">ऊर्जा मित्र</p>
          <p className="text-gray-500 text-sm mt-1">Bijli baanto, dosti badhao</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              isLogin ? 'bg-white shadow text-gray-800' : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              !isLogin ? 'bg-white shadow text-gray-800' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Home address (e.g. House #7, Maple Lane, Pune)"
                value={form.address}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <p className="text-xs text-gray-400">
                📍 We use your address to connect you with nearby neighbors
              </p>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full font-semibold py-3 rounded-lg mt-6 transition-all ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {loading
            ? '⏳ Please wait...'
            : isLogin
              ? 'Login to Urjamitra ⚡'
              : 'Join Urjamitra 🌱'
          }
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your neighborhood energy community 🏘️
        </p>
      </div>
    </div>
  );
}

export default Login;