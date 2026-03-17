import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { api } from "../services/api";

export default function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [iesConsent, setIesConsent] = useState(null);
  const [iesConsentBusy, setIesConsentBusy] = useState(false);
  const [iesConsentError, setIesConsentError] = useState('');

  // ── notification state ─────────────────────────────────────────────────────
  const [notifications, setNotifications]   = useState([]);
  const dismissedAtRef  = useRef({});        // txId → timestamp dismissed (2-min snooze)
  const shownRef        = useRef(new Set()); // IDs currently visible on screen
  const buyerSeenRef    = useRef(new Set()); // 'txId-status' buyer already notified about
  const autoClosedRef   = useRef(new Set()); // IDs that already have an auto-close timer
  const sellerInitDone  = useRef(false);
  const pollRef         = useRef(null);
  const buyerPollRef    = useRef(null);

  const currentUserId = (() => {
    try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.id || u._id || null; }
    catch { return null; }
  })();

  // ── shared helpers ─────────────────────────────────────────────────────────
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
      const res = await api.getMyTransactionsV2({ role: "seller", status: "reserved", limit: 10 });
      if (!res?.success) return;
      const now = Date.now();

      const toShow = (res.items || []).filter(tx => {
        const txId = String(tx._id);
        if (shownRef.current.has(txId)) return false;
        const dismissedAt = dismissedAtRef.current[txId] || 0;
        if (now - dismissedAt < 120000) return false;
        if (!sellerInitDone.current) return true;
        const brandNew   = now - new Date(tx.createdAt).getTime() < 25000;
        const isReminder = dismissedAt > 0 && now - dismissedAt >= 120000;
        return brandNew || isReminder;
      });

      sellerInitDone.current = true;
      if (toShow.length === 0) return;

      addNotifications(toShow.map(tx => ({
        id: String(tx._id),
        type: "seller_request",
        isReminder: (dismissedAtRef.current[String(tx._id)] || 0) > 0,
        buyerName: tx.buyer?.name || "Someone",
        units: tx.requestedUnits || tx.units || 0,
        amount: Math.round(tx.grossAmount || tx.totalAmount || 0),
      })));
    } catch {}
  };

  // ── buyer: notify when seller accepts / rejects / completes ───────────────
  const pollBuyerUpdates = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.getMyTransactionsV2({ role: "buyer", limit: 15 });
      if (!res?.success) return;
      const now = Date.now();
      const toShow = [];

      for (const tx of (res.items || [])) {
        const key = `${tx._id}-${tx.status}`;
        if (buyerSeenRef.current.has(key)) continue;
        buyerSeenRef.current.add(key);
        if (!["seller_accepted", "seller_rejected", "completed", "refunded"].includes(tx.status)) continue;
        if (now - new Date(tx.updatedAt || tx.createdAt).getTime() < 300000) toShow.push(tx);
      }

      if (toShow.length === 0) return;

      addNotifications(toShow.map(tx => ({
        id: `buyer-${tx._id}`,
        type: "buyer_update",
        status: tx.status,
        sellerName: tx.seller?.name || "Seller",
        units: tx.deliveredUnits || tx.reservedUnits || tx.units || 0,
        amount: Math.round(tx.totalAmount || tx.grossAmount || 0),
        autoClose: 9000,
      })));
    } catch {}
  };

  useEffect(() => {
    if (!currentUserId) return;
    sellerInitDone.current = false;

    // Pre-seed buyer seen set on mount — no replaying old history
    api.getMyTransactionsV2({ role: "buyer", limit: 20 }).then(res => {
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

  // Global IES consent listener so seller can approve from any page.
  useEffect(() => {
    if (!currentUserId) return;
    const socket = window.__socket;
    if (!socket) return;

    if (socket.connected) {
      socket.emit('register', currentUserId);
    }

    const onConnect = () => socket.emit('register', currentUserId);
    const onConsent = (payload) => {
      setIesConsentError('');
      setIesConsent(payload);
    };

    socket.on('connect', onConnect);
    socket.on('ies:consent_request', onConsent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('ies:consent_request', onConsent);
    };
  }, [currentUserId]);

  const handleIesConsentDecision = async (decision) => {
    if (!iesConsent?.consentId) return;
    setIesConsentBusy(true);
    setIesConsentError('');
    try {
      const res = await api.approveConsent(iesConsent.consentId, decision);
      if (!res?.success) {
        setIesConsentError(res?.message || 'Unable to submit consent decision.');
        return;
      }
      setIesConsent(null);
    } catch (err) {
      setIesConsentError(err?.response?.data?.message || 'Consent request failed.');
    } finally {
      setIesConsentBusy(false);
    }
  };

  // Auto-close buyer update notifications
  useEffect(() => {
    notifications.forEach(n => {
      if (n.autoClose && !autoClosedRef.current.has(n.id)) {
        autoClosedRef.current.add(n.id);
        setTimeout(() => dismiss(n.id), n.autoClose);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#fffdf5",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        position: "relative"
      }}
    >
      <Sidebar isOpen={isSidebarOpen} close={() => setSidebarOpen(false)} />

      <div
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          position: "relative"
        }}
      >
        <div
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>

        {children}
      </div>

      {/* Notification stack — fixed top-right, visible on every page */}
      <style>{`@keyframes navNotifIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {notifications.map((n) => {
          if (n.type === "buyer_update") {
            const cfgMap = {
              seller_accepted: { icon: "✅", title: "Request Accepted!",  color: "#15803d", bg: "rgba(240,253,244,0.97)", border: "#86efac", grad: "#22c55e,#16a34a", body: `${n.sellerName} accepted — ${n.units} kWh delivery in progress.` },
              seller_rejected: { icon: "❌", title: "Request Declined",   color: "#b91c1c", bg: "rgba(254,242,242,0.97)", border: "#fca5a5", grad: "#ef4444,#dc2626", body: `Request declined. ₹${n.amount} refunded to your wallet.` },
              completed:       { icon: "🎉", title: "Energy Delivered!",  color: "#15803d", bg: "rgba(240,253,244,0.97)", border: "#86efac", grad: "#22c55e,#16a34a", body: `${n.units} kWh received from ${n.sellerName}. Trade complete.` },
              refunded:        { icon: "💸", title: "Refund Processed",   color: "#b45309", bg: "rgba(255,251,235,0.97)", border: "#fcd34d", grad: "#f59e0b,#d97706", body: `₹${n.amount} has been returned to your wallet.` },
            };
            const cfg = cfgMap[n.status] || { icon: "ℹ️", title: "Order Update", color: "#0369a1", bg: "rgba(240,249,255,0.97)", border: "#7dd3fc", grad: "#38bdf8,#0284c7", body: "Your transaction status changed." };
            return (
              <div key={n.id} style={{ pointerEvents: "all", background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 18, padding: "16px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", minWidth: 280, maxWidth: 340, animation: "navNotifIn 0.4s cubic-bezier(0.16,1,0.3,1)", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: cfg.color, marginBottom: 4 }}>{cfg.icon} {cfg.title}</div>
                    <div style={{ fontSize: 12, color: "#451a03", fontWeight: 500, lineHeight: 1.5 }}>{cfg.body}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontWeight: 900, fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
                </div>
                <button onClick={() => { dismiss(n.id); navigate("/transactions"); }} style={{ marginTop: 10, width: "100%", padding: "8px", background: `linear-gradient(135deg,${cfg.grad})`, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>View in Transactions →</button>
              </div>
            );
          }
          return (
            <div key={n.id} style={{ pointerEvents: "all", background: "rgba(255,253,245,0.97)", border: `1.5px solid ${n.isReminder ? "#fb923c" : "#fcd34d"}`, borderRadius: 18, padding: "16px 18px", boxShadow: "0 8px 32px rgba(180,130,0,0.18)", minWidth: 280, maxWidth: 340, animation: "navNotifIn 0.4s cubic-bezier(0.16,1,0.3,1)", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: n.isReminder ? "#c2410c" : "#451a03", marginBottom: 4 }}>
                    {n.isReminder ? "⏰ Pending Request — Reminder" : "⚡ New Energy Request!"}
                  </div>
                  <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, lineHeight: 1.5 }}>
                    <strong>{n.buyerName}</strong> wants to buy <strong>{n.units} kWh</strong> · ₹{n.amount} held
                  </div>
                </div>
                <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b45309", fontWeight: 900, fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
              </div>
              <button onClick={() => { dismiss(n.id); navigate("/transactions"); }} style={{ marginTop: 10, width: "100%", padding: "8px", background: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>View Request →</button>
            </div>
          );
        })}
      </div>

      {iesConsent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div style={{ width: 'min(92vw, 500px)', background: '#fffef8', border: '1px solid #fde68a', borderRadius: 18, boxShadow: '0 20px 60px rgba(120,53,15,0.25)', padding: 22, pointerEvents: 'all' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, color: '#7c2d12', fontWeight: 900 }}>🔐 New IES Consent Request</h3>
            <p style={{ margin: '0 0 14px', color: '#92400e', fontSize: 13, lineHeight: 1.5 }}>
              Buyer requested <strong>{iesConsent.units} kWh</strong>. Approve or decline to continue DISCOM verification.
            </p>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#92400e' }}>
                Trade: <strong style={{ fontFamily: 'monospace' }}>{iesConsent.tradeId}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                Consent: <strong style={{ fontFamily: 'monospace' }}>{iesConsent.consentId}</strong>
              </p>
            </div>
            {iesConsentError && (
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{iesConsentError}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleIesConsentDecision('approve')}
                disabled={iesConsentBusy}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, fontSize: 13, background: 'linear-gradient(135deg,#f59e0b,#ea580c)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: iesConsentBusy ? 0.7 : 1 }}
              >
                {iesConsentBusy ? 'Submitting...' : 'Accept ✅'}
              </button>
              <button
                onClick={() => handleIesConsentDecision('reject')}
                disabled={iesConsentBusy}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, fontSize: 13, background: '#fff1f2', color: '#be123c', border: '1px solid #fda4af', fontWeight: 800, cursor: 'pointer', opacity: iesConsentBusy ? 0.7 : 1 }}
              >
                Decline ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}