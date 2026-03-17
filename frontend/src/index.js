import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

/* ─────────────────────────────────────────────────────────────
   Global Socket.IO — created once, stored as window.__socket
   Registers the logged-in user immediately on connect so every
   page (Dashboard, IES Trade, Messages) gets live events.
───────────────────────────────────────────────────────────── */
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api').replace('/api', '');

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 15,
});

window.__socket = socket;

const registerUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?._id && socket.connected) {
      socket.emit('register', user._id);
    }
  } catch (_) {}
};

socket.on('connect', () => {
  console.log('🟢 Socket connected:', socket.id);
  registerUser();
});
socket.on('disconnect', (reason) => console.log('🔴 Socket disconnected:', reason));
socket.on('connect_error', (err) => console.warn('⚠️ Socket error:', err.message));

// Re-register when tab regains focus
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && socket.connected) registerUser();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
