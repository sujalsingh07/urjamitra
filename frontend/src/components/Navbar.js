import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const dismissedAtRef  = useRef({});       // txId → timestamp dismissed (2-min snooze window)
  const shownRef        = useRef(new Set()); // IDs currently visible in the popup stack
  const buyerSeenRef    = useRef(new Set()); // 'txId-status' keys buyer has already been notified about
  const autoClosedRef   = useRef(new Set()); // IDs that already have an auto-close setTimeout set
  const sellerInitDone  = useRef(false);
  const pollRef         = useRef(null);
  const buyerPollRef    = useRef(null);

  const currentUserId = (() => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || null; }
    catch { return null; }
  })();

  // ── shared helper ──────────────────────────────────────────────────────────
  const addNotifications = (newNotifs) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const toAdd = newNotifs.filter(n => !existingIds.has(n.id));
      toAdd.forEach(n => shownRef.current.add(n.id));
      return [...toAdd, ...prev].slice(0, 5);
    });
  };

  const dismiss = (id) => {
    dismissedAtRef.current[id] = Date.now();
    shownRef.current.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ── seller: new requests + 2-min reminder for still-pending ones ───────────
  const pollSellerRequests = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.getMyTransactionsV2({ role: 'seller', status: 'reserved', limit: 10 });
      if (!res?.success) return;
      const items = res.items || [];
      const now = Date.now();

      const toShow = items.filter(tx => {
        const txId = String(tx._id);
        if (shownRef.current.has(txId)) return false;         // already on screen
        const dismissedAt = dismissedAtRef.current[txId] || 0;
        if (now - dismissedAt < 120000) return false;         // snoozed < 2 min
        if (!sellerInitDone.current) return true;             // first load → show all
        const txAge = now - new Date(tx.createdAt).getTime();
        const brandNew  = txAge < 25000;
        const isReminder = dismissedAt > 0 && now - dismissedAt >= 120000;
        return brandNew || isReminder;
      });

      sellerInitDone.current = true;
      if (toShow.length === 0) return;

      addNotifications(toShow.map(tx => ({
        id: String(tx._id),
        type: 'seller_request',
        isReminder: (dismissedAtRef.current[String(tx._id)] || 0) > 0,
        buyerName: tx.buyer?.name || 'Someone',
        units: tx.requestedUnits || tx.units || 0,
        amount: Math.round(tx.grossAmount || tx.totalAmount || 0),
      })));
    } catch {}
  };

  // ── buyer: notify when seller accepts / rejects / completes ───────────────
  const pollBuyerUpdates = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.getMyTransactionsV2({ role: 'buyer', limit: 15 });
      if (!res?.success) return;
      const now = Date.now();
      const toShow = [];

      for (const tx of (res.items || [])) {
        const key = `${tx._id}-${tx.status}`;
        if (buyerSeenRef.current.has(key)) continue;
        buyerSeenRef.current.add(key);
        if (!['seller_accepted', 'seller_rejected', 'completed', 'refunded'].includes(tx.status)) continue;
        const age = now - new Date(tx.updatedAt || tx.createdAt).getTime();
        if (age < 300000) toShow.push(tx); // only events within the last 5 min
      }

      if (toShow.length === 0) return;

      addNotifications(toShow.map(tx => ({
        id: `buyer-${tx._id}`,
        type: 'buyer_update',
        status: tx.status,
        sellerName: tx.seller?.name || 'Seller',
        units: tx.deliveredUnits || tx.reservedUnits || tx.units || 0,
        amount: Math.round(tx.totalAmount || tx.grossAmount || 0),
        autoClose: 9000,
      })));
    } catch {}
  };

  useEffect(() => {
    if (!currentUserId) return;
    sellerInitDone.current = false;

    // Silently mark all existing buyer statuses as seen — no spam on mount
    api.getMyTransactionsV2({ role: 'buyer', limit: 20 }).then(res => {
      (res?.items || []).forEach(tx => buyerSeenRef.current.add(`${tx._id}-${tx.status}`));
    }).catch(() => {});

    pollSellerRequests();
    pollRef.current      = setInterval(pollSellerRequests, 20000);
    buyerPollRef.current = setInterval(pollBuyerUpdates,   15000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(buyerPollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Auto-close buyer update notifications after their specified duration
  useEffect(() => {
    notifications.forEach(n => {
      if (n.autoClose && !autoClosedRef.current.has(n.id)) {
        autoClosedRef.current.add(n.id);
        setTimeout(() => dismiss(n.id), n.autoClose);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const links = [
    { path: '/dashboard', label: '⚡ Dashboard' },
    { path: '/marketplace', label: '🏪 Marketplace' },
    { path: '/map', label: '🗺️ Map' },
    { path: '/transactions', label: '📊 Transactions', badge: notifications.length },
  ];

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-yellow-500">⚡</span>
        <span className="text-xl font-bold text-gray-800">Urjamitra</span>
        <span className="text-xs text-gray-500 ml-1">ऊर्जा मित्र</span>
      </div>
      <div className="flex gap-6">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
              location.pathname === link.path
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ position: 'relative' }}
          >
            {link.label}
            {link.badge > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {JSON.parse(localStorage.getItem('user'))?.name || 'User'}
        </span>
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {JSON.parse(localStorage.getItem('user'))?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Notification stack — top-right */}
      <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        <style>{`@keyframes navNotifIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
        {notifications.map((n) => {
          if (n.type === 'buyer_update') {
            const cfgMap = {
              seller_accepted: { icon: '✅', title: 'Request Accepted!', color: '#15803d', bg: 'rgba(240,253,244,0.97)', border: '#86efac', btnGrad: '#22c55e,#16a34a', body: `${n.sellerName} accepted — ${n.units} kWh delivery in progress.` },
              seller_rejected: { icon: '❌', title: 'Request Declined',  color: '#b91c1c', bg: 'rgba(254,242,242,0.97)', border: '#fca5a5', btnGrad: '#ef4444,#dc2626', body: `Request declined. ₹${n.amount} refunded to your wallet.` },
              completed:       { icon: '🎉', title: 'Energy Delivered!', color: '#15803d', bg: 'rgba(240,253,244,0.97)', border: '#86efac', btnGrad: '#22c55e,#16a34a', body: `${n.units} kWh received from ${n.sellerName}. Trade complete.` },
              refunded:        { icon: '💸', title: 'Refund Processed',  color: '#b45309', bg: 'rgba(255,251,235,0.97)', border: '#fcd34d', btnGrad: '#f59e0b,#d97706', body: `₹${n.amount} has been returned to your wallet.` },
            };
            const cfg = cfgMap[n.status] || { icon: 'ℹ️', title: 'Order Update', color: '#0369a1', bg: 'rgba(240,249,255,0.97)', border: '#7dd3fc', btnGrad: '#38bdf8,#0284c7', body: 'Your transaction status changed.' };
            return (
              <div key={n.id} style={{ pointerEvents: 'all', background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 18, padding: '16px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.8)', minWidth: 280, maxWidth: 340, animation: 'navNotifIn 0.4s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: cfg.color, marginBottom: 4 }}>{cfg.icon} {cfg.title}</div>
                    <div style={{ fontSize: 12, color: '#451a03', fontWeight: 500, lineHeight: 1.5 }}>{cfg.body}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontWeight: 900, fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
                </div>
                <button onClick={() => { dismiss(n.id); navigate('/transactions'); }} style={{ marginTop: 10, width: '100%', padding: '8px', background: `linear-gradient(135deg,${cfg.btnGrad})`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>View in Transactions →</button>
              </div>
            );
          }
          // Seller request notification (new or reminder)
          return (
            <div key={n.id} style={{ pointerEvents: 'all', background: 'rgba(255,253,245,0.97)', border: `1.5px solid ${n.isReminder ? '#fb923c' : '#fcd34d'}`, borderRadius: 18, padding: '16px 18px', boxShadow: '0 8px 32px rgba(180,130,0,0.18), 0 0 0 1px rgba(255,255,255,0.8)', minWidth: 280, maxWidth: 340, animation: 'navNotifIn 0.4s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: n.isReminder ? '#c2410c' : '#451a03', marginBottom: 4 }}>
                    {n.isReminder ? '⏰ Pending Request — Reminder' : '⚡ New Energy Request!'}
                  </div>
                  <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, lineHeight: 1.5 }}>
                    <strong>{n.buyerName}</strong> wants to buy <strong>{n.units} kWh</strong> · ₹{n.amount} held
                  </div>
                </div>
                <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: 900, fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
              </div>
              <button onClick={() => { dismiss(n.id); navigate('/transactions'); }} style={{ marginTop: 10, width: '100%', padding: '8px', background: 'linear-gradient(135deg,#f59e0b,#ea580c)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>View Request →</button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;