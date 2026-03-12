import axios from 'axios';

// Shared axios instance (can be used for both marketplace and campus-network APIs)
// Ensure REACT_APP_API_BASE_URL points to your backend, e.g. http://localhost:5001/api
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

export const fetchNetworkMetrics = () => apiClient.get('/metrics');
export const fetchDevices = () => apiClient.get('/devices');
export const fetchPolicies = () => apiClient.get('/policies');
export const createPolicy = (policy) => apiClient.post('/policies', policy);
export const updatePolicy = (id, policy) => apiClient.put(`/ policies / ${id} `, policy);
export const fetchTrafficLogs = () => apiClient.get('/traffic/logs');

// Legacy/Marketplace API (used by Marketplace + Transactions pages)
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const gettoken = () => localStorage.getItem('token');

export const api = {
  // Auth
  signup: (data) =>
    fetch(`${API_BASE} /auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  login: (email, password) =>
    fetch(`${API_BASE} /auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json()),

  // Listings
  getListings: () =>
    fetch(`${API_BASE} /listings/all`).then((res) => res.json()),

  getMyListings: () =>
    fetch(`${API_BASE} /listings/my - listings`, {
      headers: { Authorization: `Bearer ${gettoken()} ` },
    }).then((res) => res.json()),

  createListing: (data) =>
    fetch(`${API_BASE} /listings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gettoken()} `,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  deleteListing: (listingId) =>
    fetch(`${API_BASE} /listings/${listingId} `, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${gettoken()} ` },
    }).then((res) => res.json()),

  // Transactions
  getMyTransactions: () =>
    fetch(`${API_BASE} /transactions/my - transactions`, {
      headers: { Authorization: `Bearer ${gettoken()} ` },
    }).then((res) => res.json()),

  purchaseEnergy: (listingId, units) =>
    fetch(`${API_BASE} /transactions/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gettoken()} `,
      },
      body: JSON.stringify({ listingId, units }),
    }).then((res) => res.json()),

  // Users / Profile
  getProfile: (userId) =>
    fetch(`${API_BASE} /users/profile / ${userId} `).then((res) => res.json()),

  getMyProfile: () =>
    fetch(`${API_BASE} /users/me`, {
      headers: { Authorization: `Bearer ${gettoken()} ` },
    }).then((res) => res.json()),

  updateProfile: (data) =>
    fetch(`${API_BASE} /users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gettoken()} `,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  addBalance: (amount) =>
    fetch(`${API_BASE} /users/add - balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gettoken()} `,
      },
      body: JSON.stringify({ amount }),
    }).then((res) => res.json()),

  leaveReview: (revieweeId, rating, comment, transactionId) =>
    fetch(`${API_BASE} /users/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gettoken()} `,
      },
      body: JSON.stringify({ revieweeId, rating, comment, transactionId }),
    }).then((res) => res.json()),

  getUserReviews: (userId) =>
    fetch(`${API_BASE} /users/reviews / ${userId} `).then((res) => res.json()),
};
