import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes shine { 100% { left: 150%; } }
  
  .um-card { 
    background: rgba(255, 255, 255, 0.65) !important;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.8) !important;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .um-card:hover { 
    transform: translateY(-4px) scale(1.01); 
    box-shadow: 0 24px 48px rgba(180,130,0,0.08), 0 0 0 1px rgba(255,255,255,1) !important; 
    z-index: 10; 
  }

  .premium-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(253,230,138,0.5);
    border-radius: 14px;
    padding: 16px 20px;
    font-size: 15px;
    color: #451a03;
    outline: none;
    font-family: "'DM Sans', sans-serif";
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .premium-input::placeholder { color: #b45309; opacity: 0.6; }
  .premium-input:focus {
    background: #fff;
    border-color: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15), inset 0 2px 4px rgba(0,0,0,0.01);
    transform: translateY(-1px);
  }

  .gradient-btn { 
    background: linear-gradient(135deg, #f59e0b, #ea580c); 
    color: #fff; 
    border: none; 
    border-radius: 14px; 
    padding: 12px 24px; 
    font-weight: 800; 
    font-size: 14px; 
    letter-spacing: -0.2px; 
    cursor: pointer; 
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
    box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255,255,255,0.4); 
    display: inline-flex; align-items: center; justify-content: center; gap: 10px; 
    position: relative; overflow: hidden; 
  }
  .gradient-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); transition: 0s; }
  .gradient-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: 0 16px 32px rgba(234, 88, 12, 0.35); }
  .gradient-btn:hover:not(:disabled)::after { animation: shine 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .gradient-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }

  .pill { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
  .pill:hover:not(.active) { background: rgba(255,255,255,0.9) !important; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(180,130,0,0.08); }
  
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
`;

export default function Marketplace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('all');
  const [filter, setFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listingForm, setListingForm] = useState({ units: '', pricePerUnit: '' });
  const [done, setDone] = useState(false);
  const [buyModal, setBuyModal] = useState(null);   // listing object
  const [buyUnits, setBuyUnits] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyResult, setBuyResult] = useState(null); // { status, message }
  const [tradeLogs, setTradeLogs] = useState([]);
  const [activeTradeId, setActiveTradeId] = useState(null);
  const [tradePhase, setTradePhase] = useState('idle');
  const [tradeReceipt, setTradeReceipt] = useState(null);
  const [pendingConsent, setPendingConsent] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [consumeUnusedOnPost, setConsumeUnusedOnPost] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    const socket = window.__socket;
    if (!socket) return;

    const onListingChanged = () => {
      fetchListings();
    };

    socket.on('listing:changed', onListingChanged);
    return () => {
      socket.off('listing:changed', onListingChanged);
    };
  }, []);

  useEffect(() => {
    if (location.state?.openListModal) {
      setShowListModal(true);
      const units = Number(location.state?.prefillUnits || 0);
      if (units > 0) {
        setConsumeUnusedOnPost(true);
        setListingForm((prev) => ({
          ...prev,
          units: units.toFixed(2)
        }));
      } else {
        setConsumeUnusedOnPost(false);
      }
    } else {
      setConsumeUnusedOnPost(false);
    }
  }, [location.state]);

  useEffect(() => {
    const listingId = location.state?.openListingId;
    if (!listingId || loading) return;

    const target = listings.find((l) => String(l._id) === String(listingId));
    if (target) {
      setViewMode('all');
      setFilter('all');
      openBuyModal(target);
    } else {
      setError('That listing is no longer available.');
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, listings, loading, navigate, location.pathname]);

  useEffect(() => {
    const socket = window.__socket;
    if (!socket) return;

    const appendLogs = (incoming) => {
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      setTradeLogs((prev) => {
        const seen = new Set(prev.map((l) => `${l.time}|${l.event}`));
        const next = [...prev];
        incoming.forEach((l) => {
          const key = `${l.time}|${l.event}`;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(l);
          }
        });
        return next;
      });
    };

    const onLog = (payload) => {
      if (!activeTradeId || payload?.tradeId !== activeTradeId) return;
      appendLogs(payload.logs || []);
    };

    const onTradeUpdate = (payload) => {
      if (!activeTradeId || payload?.tradeId !== activeTradeId) return;
      const status = payload?.status;
      if (status === 'consent_approved') setTradePhase('verifying');
      else if (status === 'discom_verified') setTradePhase('settling');
      else if (status === 'consent_rejected') {
        setTradePhase('failed');
        setBuyResult({ status: 'err', message: 'Seller rejected consent. Trade cancelled.' });
      }
    };

    const onConsentRequest = (payload) => {
      if (!payload?.consentId) return;
      if (!activeTradeId) setActiveTradeId(payload.tradeId);
      setPendingConsent(payload);
      setTradePhase('awaiting_my_consent');
      setTradeLogs((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          level: 'warning',
          event: `[IES] Consent request received for trade ${payload.tradeId}.`,
        },
      ]);
    };

    const onSettlement = (payload) => {
      if (!activeTradeId || payload?.tradeId !== activeTradeId) return;
      setTradeLogs((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          level: 'success',
          event: `[DISCOM] ✅ Trade approved and settled for ${payload?.units ?? buyUnits} kWh.`,
        },
        {
          time: new Date().toISOString(),
          level: 'success',
          event: `[IES] Settlement completed. Txn Hash: ${payload?.txnHash || 'N/A'}`,
        },
      ]);
      setTradeReceipt(payload);
      setTradePhase('settled');
      setBuyLoading(false);
      setBuyResult({ status: 'ok', message: 'IES trade settled successfully.' });
      setSuccessMessage('IES settlement completed with live DISCOM verification.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      fetchListings();
    };

    socket.on('ies:log', onLog);
    socket.on('ies:trade_update', onTradeUpdate);
    socket.on('ies:consent_request', onConsentRequest);
    socket.on('ies:settlement', onSettlement);

    return () => {
      socket.off('ies:log', onLog);
      socket.off('ies:trade_update', onTradeUpdate);
      socket.off('ies:consent_request', onConsentRequest);
      socket.off('ies:settlement', onSettlement);
    };
  }, [activeTradeId]);

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user._id || null;
    } catch {
      return null;
    }
  };

  const getSellerId = (listing) => listing?.seller?._id || listing?.seller?.id || listing?.seller;

  const getListingLocationLabel = (listing) => {
    const raw = String(listing?.location?.address || listing?.seller?.address || '').trim();
    if (!raw || raw.toLowerCase() === 'campus') return 'Location TBD';
    return raw;
  };

  const mapTxErrorMessage = (res) => {
    const code = res?.code;
    if (code === 'LISTING_UNAVAILABLE') return 'This listing is no longer available or has fewer units now.';
    if (code === 'INSUFFICIENT_WALLET') return 'Insufficient wallet balance for this request.';
    if (code === 'FORBIDDEN_ACTION') return 'You cannot buy your own listing.';
    if (code === 'INVALID_REQUEST') return 'Enter a valid units value before requesting.';
    return res?.message || res?.error || 'Unable to place request right now. Please try again.';
  };

  const loadWalletFromProfile = async () => {
    const profileRes = await api.getMyProfile();
    if (profileRes?.success && profileRes?.user) {
      const nextWallet = Number(profileRes.user.wallet || 0);
      setWalletBalance(nextWallet);
      try {
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...current, ...profileRes.user }));
      } catch {
        // no-op: avoid blocking UI on localStorage parse failures
      }
      return;
    }

    try {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      setWalletBalance(Number(localUser.wallet || 0));
    } catch {
      setWalletBalance(0);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);

      const [allRes, mineRes] = await Promise.all([api.getListings(), api.getMyListings()]);

      if (allRes.success) {
        setListings(allRes.listings || []);
      } else {
        setListings([]);
        setError(allRes.message || 'Failed to fetch listings');
      }

      if (mineRes.success) {
        setMyListings(mineRes.listings || []);
      } else {
        setMyListings([]);
      }

      await loadWalletFromProfile();
    } catch { setError('Error fetching listings'); }
    finally { setLoading(false); }
  };

  const handleCreateListing = async () => {
    try {
      if (!listingForm.units || !listingForm.pricePerUnit) { setError('Please fill all fields'); return; }

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const savedAddress = user?.address;
      const savedLatitude = user?.location?.latitude;
      const savedLongitude = user?.location?.longitude;

      if (!savedAddress || savedAddress === 'Campus') {
        setError('Please complete your profile address first.');
        return;
      }

      const payload = {
        units: parseFloat(listingForm.units),
        pricePerUnit: parseFloat(listingForm.pricePerUnit),
        consumeUnusedEnergy: consumeUnusedOnPost,
        location: {
          address: savedAddress,
          latitude: Number.isFinite(savedLatitude) ? savedLatitude : undefined,
          longitude: Number.isFinite(savedLongitude) ? savedLongitude : undefined,
        }
      };

      const res = await api.createListing(payload);

      if (res.success) {
        setShowListModal(false);
        setListingForm({ units: '', pricePerUnit: '' });
        setConsumeUnusedOnPost(false);
        setDone(true);
        setTimeout(() => setDone(false), 3000);
        fetchListings();

        // 🔌 Seed smart meter as prosumer so live telemetry shows solar surplus
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?._id && window.__socket) {
          window.__socket.emit('meter:setProsumer', {
            userId: user._id,
            generationKw: Math.max(8, parseFloat(listingForm.units) * 1.5) || 8,
            consumptionKw: 3,
          });
        }
      }
      else setError(res.message);
    } catch { setError('Error creating listing'); }
  };

  const openBuyModal = (listing) => {
    setBuyModal(listing);
    setBuyUnits('');
    setBuyResult(null);
    setTradeLogs([]);
    setActiveTradeId(null);
    setTradePhase('idle');
    setTradeReceipt(null);
    setPendingConsent(null);
    loadWalletFromProfile();
  };

  const handleRequestTransaction = async () => {
    if (!buyModal || !buyUnits || parseFloat(buyUnits) <= 0) return;
    setBuyLoading(true);
    setBuyResult(null);
    setTradeLogs([]);
    setTradeReceipt(null);
    setPendingConsent(null);
    setTradePhase('initiating');
    try {
      const res = await api.initiateIESTrade(buyModal._id, parseFloat(buyUnits));
      if (res.success) {
        setActiveTradeId(res.tradeId);
        setTradePhase('awaiting_consent');
        setBuyResult({ status: 'ok', message: 'Trade initiated. Waiting for consent and DISCOM verification...' });
        setTradeLogs([
          { time: new Date().toISOString(), level: 'info', event: `[IES] Trade started (${res.tradeId})` },
          { time: new Date().toISOString(), level: 'info', event: `[IES] Requesting seller consent for ${buyUnits} kWh...` },
        ]);
      } else {
        setTradePhase('failed');
        setBuyResult({ status: 'err', message: mapTxErrorMessage(res) });
      }
    } catch (err) {
      setTradePhase('failed');
      setBuyResult({ status: 'err', message: mapTxErrorMessage(err?.response?.data || { error: 'Network or server error' }) });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleConsentDecision = async (decision) => {
    if (!pendingConsent?.consentId) return;
    setBuyLoading(true);
    try {
      const res = await api.approveConsent(pendingConsent.consentId, decision);
      if (res?.success) {
        setTradePhase(decision === 'approve' ? 'verifying' : 'failed');
        setPendingConsent(null);
        setTradeLogs((prev) => [
          ...prev,
          {
            time: new Date().toISOString(),
            level: decision === 'approve' ? 'success' : 'warning',
            event: decision === 'approve'
              ? '[IES] Seller approved consent. Waiting for DISCOM verification...'
              : '[IES] Seller rejected consent. Trade cancelled.',
          },
        ]);
      } else {
        setTradePhase('failed');
        setBuyResult({ status: 'err', message: res?.message || 'Unable to process consent decision.' });
      }
    } catch (err) {
      setTradePhase('failed');
      setBuyResult({ status: 'err', message: err?.response?.data?.message || 'Consent approval failed.' });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    try {
      const res = await api.deleteListing(listingId);
      if (res.success) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
        fetchListings();
      } else {
        setError(res.message || 'Failed to remove listing');
      }
    } catch {
      setError('Error removing listing');
    }
  };

  const currentUserId = getCurrentUserId();
  const allNeighborListings = listings.filter((l) => {
    const sellerId = getSellerId(l);
    return !currentUserId || String(sellerId) !== String(currentUserId);
  });

  const baseListings = viewMode === 'my' ? myListings : allNeighborListings;

  const filtered = baseListings
    .filter(l => filter === 'available' ? l.available : true)
    .sort((a, b) => filter === 'cheap' ? a.pricePerUnit - b.pricePerUnit : 0);

  const neighborAvailableCount = allNeighborListings.filter((l) => l.available).length;
  const myAvailableCount = myListings.filter((l) => l.available).length;

  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: 'radial-gradient(ellipse at top right, rgba(253,230,138,0.35), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.35), transparent 70%), #fffdf5',
      backgroundSize: '200% 200%',
      minHeight: '100vh'
    }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ padding: '48px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#92740a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Urjamitra</p>
            <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>⚡ Energy Marketplace</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: 'blink 2.5s infinite', boxShadow: '0 0 8px rgba(22,163,74,0.6)' }} />
              <p style={{ margin: 0, fontSize: 13, color: '#15803d', fontWeight: 700 }}>
                {viewMode === 'my' ? `${myAvailableCount} active listing${myAvailableCount === 1 ? '' : 's'} by you` : `${neighborAvailableCount} listings available near you`}
              </p>
            </div>
          </div>
          <button onClick={() => setShowListModal(true)} className="gradient-btn" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
            + List My Energy
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Toasts */}
        {done && (
          <div className="um-card" style={{ background: 'rgba(220,252,231,0.85)', border: '1px solid #86efac', color: '#15803d', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <span style={{ fontSize: 20 }}>✅</span> <strong>Listing created!</strong> Neighbors can now see your energy.
          </div>
        )}
        {showSuccess && (
          <div className="um-card" style={{ background: 'rgba(220,252,231,0.85)', border: '1px solid #86efac', color: '#15803d', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <span style={{ fontSize: 20 }}>⚡</span> <strong>{successMessage || 'Trade completed!'}</strong>
          </div>
        )}
        {error && (
          <div className="um-card" style={{ background: 'rgba(254,242,242,0.85)', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 16, padding: '16px 20px', marginBottom: 20, fontSize: 13, animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>❌ {error}</div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
          {[['all', 'Community Listings'], ['my', 'My Listings']].map(([k, l]) => (
            <button key={k} className={`pill ${viewMode === k ? 'active' : ''}`} onClick={() => setViewMode(k)}
              style={{
                padding: '10px 18px', borderRadius: 14, border: '1px solid',
                borderColor: viewMode === k ? '#92400e' : 'rgba(253,230,138,0.8)',
                background: viewMode === k ? 'linear-gradient(135deg,#f59e0b,#ea580c)' : 'rgba(255,255,255,0.65)',
                color: viewMode === k ? '#fff' : '#92400e',
                fontWeight: 800, fontSize: 13,
                boxShadow: viewMode === k ? '0 8px 16px rgba(234,88,12,0.25), inset 0 1px 1px rgba(255,255,255,0.4)' : 'none'
              }}>
              {l}
            </button>
          ))}
        </div>

        {viewMode === 'all' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
            {[['all', 'All'], ['available', 'Available Now'], ['cheap', 'Cheapest First']].map(([k, l]) => (
              <button key={k} className={`pill ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}
                style={{
                  padding: '10px 20px', borderRadius: 14, border: '1px solid',
                  borderColor: filter === k ? '#ea580c' : 'rgba(253,230,138,0.8)',
                  background: filter === k ? 'linear-gradient(135deg,#f59e0b,#ea580c)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: filter === k ? 'none' : 'blur(12px)',
                  color: filter === k ? '#fff' : '#92400e',
                  fontWeight: 800, fontSize: 13,
                  boxShadow: filter === k ? '0 8px 16px rgba(234,88,12,0.25), inset 0 1px 1px rgba(255,255,255,0.4)' : 'none'
                }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: 'blink 1.5s infinite' }}>☀️</div>
            <p style={{ color: '#a16207', fontSize: 15, fontWeight: 600 }}>Loading energy listings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="um-card" style={{ textAlign: 'center', padding: '80px 0', borderRadius: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ color: '#92400e', fontSize: 15, fontWeight: 600 }}>{viewMode === 'my' ? 'You have no listings yet.' : 'No listings from neighbors right now.'}</p>
            <button onClick={() => setShowListModal(true)} className="gradient-btn" style={{ marginTop: 24, padding: '14px 28px', fontSize: 15 }}>
              + List Energy
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((listing, idx) => (
              <div key={listing._id} className="um-card" style={{
                borderRadius: 24, padding: '24px',
                opacity: listing.available ? 1 : 0.6,
                animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + (idx * 0.05)}s both`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#fef08a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e', fontWeight: 900, fontSize: 24, flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,0.25), inset 0 2px 4px rgba(255,255,255,0.4)' }}>
                      {listing.seller?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#451a03', letterSpacing: -0.3 }}>{listing.seller?.name || 'Unknown'}</h3>
                        <span style={{ fontSize: 12, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 8, fontWeight: 800 }}>★ {(listing.seller?.rating || 5).toFixed(1)}</span>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#92400e', fontWeight: 500 }}>📍 {getListingLocationLabel(listing)}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#b45309', opacity: 0.7, fontWeight: 600 }}>Listed {new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#451a03', letterSpacing: -1, marginBottom: 4 }}>
                      ₹{listing.pricePerUnit}<span style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>/kWh</span>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#a16207', fontWeight: 700 }}>{listing.units} kWh available</p>
                    {viewMode === 'my' ? (
                      <button onClick={() => handleDeleteListing(listing._id)} style={{
                        background: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fda4af',
                        borderRadius: 12,
                        padding: '9px 18px',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}>
                        Remove
                      </button>
                    ) : listing.available ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate('/messages', { state: { autoOpenUser: listing.seller } })} style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 12, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(245,158,11,0.1)' }}>
                          💬 Ask
                        </button>
                        <button onClick={() => openBuyModal(listing)} className="gradient-btn" style={{ padding: '8px 24px' }}>
                          Buy ⚡
                        </button>
                      </div>
                    ) : (
                      <span style={{ background: '#fef9c3', color: '#a16207', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, border: '1px solid #fde68a' }}>Sold Out</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(253,230,138,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>💰 Max: <strong style={{ color: '#15803d', fontSize: 14 }}>₹{(listing.units * listing.pricePerUnit).toFixed(0)}</strong></span>
                    <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>🌿 Saves <strong style={{ color: '#16a34a', fontSize: 14 }}>{(listing.units * 0.8).toFixed(1)}</strong> kg CO₂</span>
                  </div>
                  {listing.available && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: 'blink 2.5s infinite', boxShadow: '0 0 6px rgba(22,163,74,0.4)' }} />
                      <span style={{ fontSize: 12, color: '#15803d', fontWeight: 800 }}>Available Now</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
        }
      </div >

      {/* LIST MODAL */}
      {
        showListModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(69, 26, 3, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              background: 'rgba(255, 253, 245, 0.95)',
              borderRadius: '32px 32px 0 0', padding: '32px 32px 48px', width: '100%', maxWidth: 540,
              boxShadow: '0 -24px 80px rgba(180,130,0,0.2), 0 0 0 1px rgba(255,255,255,0.8)',
              animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900, color: '#451a03', letterSpacing: -0.5 }}>⚡ List Your Energy</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>Neighbors nearby will see your listing.</p>
                </div>
                <button onClick={() => setShowListModal(false)} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 14, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
              </div>

              {[['units', 'Units available (kWh)', 'e.g. 5', 'number'], ['pricePerUnit', 'Price per kWh (₹)', 'e.g. 18', 'number']].map(([f, l, p, t]) => (
                <div key={f} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#a16207', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</label>
                  <input type={t} placeholder={p} value={listingForm[f]} onChange={e => setListingForm({ ...listingForm, [f]: e.target.value })} className="premium-input" />
                </div>
              ))}

              {listingForm.units && listingForm.pricePerUnit && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeUp 0.3s ease' }}>
                  <span style={{ fontSize: 14, color: '#15803d', fontWeight: 700 }}>You'll earn if fully sold</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#15803d', letterSpacing: -1 }}>₹{(parseFloat(listingForm.units) * parseFloat(listingForm.pricePerUnit) || 0).toFixed(0)}</span>
                </div>
              )}

              <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>💡</span> <span>Avg price in your area: <strong style={{ color: '#78350f' }}>₹16–20/kWh</strong></span></p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowListModal(false)} style={{ flex: 1, padding: '16px', background: 'rgba(253,230,138,0.3)', color: '#92400e', border: '1px solid rgba(253,230,138,0.8)', borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>Cancel</button>
                <button onClick={handleCreateListing} className="gradient-btn" style={{ flex: 2, padding: '16px', borderRadius: 16, fontSize: 15 }}>Post Listing ⚡</button>
              </div>
            </div>
          </div>
        )
      }

      {/* BUY / REQUEST MODAL */}
      {buyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(69,26,3,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ background: 'rgba(255,253,245,0.97)', borderRadius: '32px 32px 0 0', padding: '32px 32px 48px', width: '100%', maxWidth: 540, boxShadow: '0 -24px 80px rgba(180,130,0,0.2), 0 0 0 1px rgba(255,255,255,0.8)', animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#451a03', letterSpacing: -0.5 }}>⚡ Buy With Live IES Flow</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>From <strong>{buyModal.seller?.name || 'Seller'}</strong> · ₹{buyModal.pricePerUnit}/kWh · {buyModal.units} kWh available</p>
              </div>
              <button onClick={() => setBuyModal(null)} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 14, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Wallet balance pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,251,235,0.8)', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700 }}>💳 Your Wallet Balance</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: walletBalance > 0 ? '#15803d' : '#b91c1c', letterSpacing: -0.5 }}>₹{walletBalance}</span>
            </div>

            {buyResult && tradePhase === 'failed' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{buyResult.status === 'ok' ? '✅' : '❌'}</div>
                <p style={{ fontWeight: 800, fontSize: 16, color: buyResult.status === 'ok' ? '#15803d' : '#b91c1c', margin: 0 }}>{buyResult.message}</p>
                {buyResult.status === 'err' && (
                  <button onClick={() => setBuyResult(null)} style={{ marginTop: 14, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    Try Again
                  </button>
                )}
              </div>
            ) : (
              <>
                {!activeTradeId && (
                <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#a16207', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Units to request (kWh)</label>
                  <input type="number" placeholder={`Max ${buyModal.units} kWh`} max={buyModal.units} min={0.1} step={0.1} value={buyUnits} onChange={e => setBuyUnits(e.target.value)} className="premium-input" />
                </div>

                {buyUnits && parseFloat(buyUnits) > 0 && (() => {
                  const requested = parseFloat(buyUnits);
                  const total = requested * buyModal.pricePerUnit;
                  const overLimit = requested > buyModal.units;
                  const canAfford = walletBalance >= total;
                  const isInvalid = overLimit || !canAfford;
                  return (
                    <div style={{ background: isInvalid ? '#fff1f2' : '#f0fdf4', border: `1px solid ${isInvalid ? '#fda4af' : '#86efac'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16, animation: 'fadeUp 0.3s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: isInvalid ? '#b91c1c' : '#15803d', fontWeight: 600 }}>{buyUnits} kWh × ₹{buyModal.pricePerUnit}</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: isInvalid ? '#b91c1c' : '#15803d' }}>₹{total.toFixed(0)}</span>
                      </div>
                      {overLimit ? (
                        <p style={{ margin: 0, fontSize: 11, color: '#b91c1c', fontWeight: 700 }}>⚠ Only {buyModal.units} kWh available — reduce your request</p>
                      ) : !canAfford ? (
                        <p style={{ margin: 0, fontSize: 11, color: '#b91c1c', fontWeight: 700 }}>⚠ Insufficient balance — you need ₹{(total - walletBalance).toFixed(0)} more</p>
                      ) : (
                        <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Amount is deducted only after consent + DISCOM verification settles the trade</p>
                      )}
                    </div>
                  );
                })()}

                <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 14, padding: '12px 16px', marginBottom: 24 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏱</span> IES will run consent, DISCOM verification, and settlement in real time after you initiate.
                  </p>
                </div>
                </>
                )}

                {activeTradeId && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ background: '#0b1220', border: '1px solid #1f2937', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, letterSpacing: 0.6 }}>LIVE IES CONSOLE</span>
                        <span style={{ fontSize: 11, color: '#34d399', fontFamily: 'monospace' }}>{tradePhase.replaceAll('_', ' ').toUpperCase()}</span>
                      </div>
                      <div style={{ maxHeight: 170, overflowY: 'auto', borderTop: '1px solid #1f2937', paddingTop: 8 }}>
                        {tradeLogs.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>Waiting for IES events...</p>
                        ) : tradeLogs.map((log, idx) => (
                          <p key={`${log.time}-${idx}`} style={{ margin: '0 0 5px', fontSize: 11, color: log.level === 'error' ? '#fca5a5' : log.level === 'warning' ? '#fcd34d' : log.level === 'success' ? '#86efac' : '#cbd5e1', fontFamily: 'monospace' }}>
                            [{new Date(log.time).toLocaleTimeString()}] {log.event}
                          </p>
                        ))}
                      </div>
                    </div>

                    {pendingConsent && (
                      <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#1d4ed8', fontWeight: 800 }}>Consent required for this trade.</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleConsentDecision('approve')} className="gradient-btn" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12 }}>Approve Consent</button>
                          <button onClick={() => handleConsentDecision('reject')} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, background: '#fff1f2', color: '#be123c', border: '1px solid #fda4af', fontWeight: 800, cursor: 'pointer' }}>Reject</button>
                        </div>
                      </div>
                    )}

                    {tradeReceipt && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#15803d', fontWeight: 800 }}>Settlement Complete ✅</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>Txn Hash: <strong style={{ fontFamily: 'monospace' }}>{tradeReceipt.txnHash}</strong></p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setBuyModal(null)} style={{ flex: 1, padding: '16px', background: 'rgba(253,230,138,0.3)', color: '#92400e', border: '1px solid rgba(253,230,138,0.8)', borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button
                    onClick={handleRequestTransaction}
                    disabled={buyLoading || activeTradeId || !buyUnits || parseFloat(buyUnits) <= 0 || parseFloat(buyUnits) > buyModal.units || walletBalance < parseFloat(buyUnits) * buyModal.pricePerUnit}
                    className="gradient-btn"
                    style={{ flex: 2, padding: '16px', borderRadius: 16, fontSize: 15, opacity: (activeTradeId || !buyUnits || parseFloat(buyUnits) <= 0 || parseFloat(buyUnits) > buyModal.units || walletBalance < parseFloat(buyUnits) * buyModal.pricePerUnit) ? 0.5 : 1 }}>
                    {buyLoading ? 'Starting IES Flow…' : activeTradeId ? 'IES Flow Running…' : 'Initiate IES Trade ⚡'}
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        )
      }

      {/* GLOBAL CONSENT POPUP FOR SELLER (works even without opening buy modal) */}
      {pendingConsent && !buyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div style={{ width: 'min(92vw, 480px)', background: '#fffef8', border: '1px solid #fde68a', borderRadius: 18, boxShadow: '0 20px 60px rgba(120,53,15,0.25)', padding: 22 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, color: '#7c2d12', fontWeight: 900 }}>🔐 IES Consent Required</h3>
            <p style={{ margin: '0 0 14px', color: '#92400e', fontSize: 13, lineHeight: 1.5 }}>
              A buyer initiated a trade. Approve or decline to continue DEPA consent verification.
            </p>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#92400e' }}>
                Trade: <strong style={{ fontFamily: 'monospace' }}>{pendingConsent.tradeId}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                Units requested: <strong>{pendingConsent.units} kWh</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleConsentDecision('approve')}
                className="gradient-btn"
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, fontSize: 13 }}
              >
                Accept ✅
              </button>
              <button
                onClick={() => handleConsentDecision('reject')}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, fontSize: 13, background: '#fff1f2', color: '#be123c', border: '1px solid #fda4af', fontWeight: 800, cursor: 'pointer' }}
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