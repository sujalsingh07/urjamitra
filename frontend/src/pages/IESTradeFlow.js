import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@700;800&display=swap');

  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.4)} 50%{box-shadow:0 0 24px rgba(34,197,94,0.8)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes hashReveal { from{letter-spacing:-2px;opacity:0} to{letter-spacing:1px;opacity:1} }
  @keyframes successPop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes tickerMove { from{transform:translateX(0)} to{transform:translateX(-50%)} }

  .ies-wrap {
    font-family: 'Space Grotesk', sans-serif;
    background: #0a0f1e;
    min-height: 100vh;
    color: #e2e8f0;
    padding: 24px;
  }

  .ies-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
  }

  .ies-badge {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 4px;
    letter-spacing: 1px;
  }

  .ies-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, #22c55e, #86efac);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Live Ticker */
  .ticker-wrap {
    background: rgba(34,197,94,0.06);
    border: 1px solid rgba(34,197,94,0.15);
    border-radius: 8px;
    overflow: hidden;
    height: 36px;
    display: flex;
    align-items: center;
    margin-bottom: 28px;
  }
  .ticker-label {
    background: #22c55e;
    color: #000;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 0 12px;
    height: 100%;
    display: flex;
    align-items: center;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ticker-inner {
    display: flex;
    animation: tickerMove 20s linear infinite;
    white-space: nowrap;
  }
  .ticker-item {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #86efac;
    padding: 0 32px;
  }

  /* Grid layout */
  .ies-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  @media (max-width: 900px) { .ies-grid { grid-template-columns: 1fr; } }

  /* Phase cards */
  .phase-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px;
    transition: border-color 0.3s;
    animation: fadeUp 0.4s ease both;
  }
  .phase-card.active { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.04); }
  .phase-card.completed { border-color: rgba(34,197,94,0.2); }
  .phase-card.error { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.04); }

  .phase-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #64748b;
    letter-spacing: 2px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .phase-name {
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 16px;
  }

  /* Telemetry bars */
  .meter-bar-wrap { margin-bottom: 12px; }
  .meter-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
  }
  .meter-bar-track {
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  .meter-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.16,1,0.3,1);
  }

  /* IES Console */
  .console-wrap {
    background: #050a14;
    border: 1px solid rgba(34,197,94,0.2);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .console-header {
    background: rgba(34,197,94,0.08);
    border-bottom: 1px solid rgba(34,197,94,0.15);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .console-dot { width: 10px; height: 10px; border-radius: 50%; }
  .console-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #22c55e;
    margin-left: 4px;
  }
  .console-body {
    padding: 16px;
    max-height: 260px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }
  .console-body::-webkit-scrollbar { width: 4px; }
  .console-body::-webkit-scrollbar-track { background: transparent; }
  .console-body::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); border-radius: 2px; }
  .log-line {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.8;
    animation: slideIn 0.3s ease;
  }
  .log-info    { color: #94a3b8; }
  .log-success { color: #22c55e; }
  .log-warning { color: #f59e0b; }
  .log-error   { color: #ef4444; }
  .log-time    { color: #475569; margin-right: 8px; }

  /* Buttons */
  .ies-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ies-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ies-btn-green  { background: #22c55e; color: #000; }
  .ies-btn-green:hover:not(:disabled) { background: #16a34a; transform: translateY(-1px); }
  .ies-btn-red    { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .ies-btn-red:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
  .ies-btn-ghost  { background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
  .ies-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #f1f5f9; }

  /* Consent modal */
  .consent-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .consent-modal {
    background: #0f172a;
    border: 1px solid rgba(34,197,94,0.3);
    border-radius: 20px;
    padding: 32px;
    max-width: 440px;
    width: 100%;
    animation: successPop 0.3s ease;
  }
  .consent-icon {
    width: 56px; height: 56px;
    background: rgba(34,197,94,0.1);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin-bottom: 20px;
    animation: glow 2s ease-in-out infinite;
  }
  .consent-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 8px;
  }
  .consent-detail {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 16px;
    margin: 16px 0;
  }
  .consent-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .consent-row:last-child { margin-bottom: 0; }
  .consent-label { color: #64748b; }
  .consent-value { color: #f1f5f9; font-weight: 600; }

  /* Success receipt */
  .receipt-wrap {
    background: rgba(34,197,94,0.05);
    border: 1px solid rgba(34,197,94,0.25);
    border-radius: 16px;
    padding: 28px;
    animation: successPop 0.4s ease;
  }
  .receipt-hash {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #22c55e;
    word-break: break-all;
    animation: hashReveal 0.8s ease 0.3s both;
    background: rgba(34,197,94,0.08);
    border: 1px solid rgba(34,197,94,0.2);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
  }
  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 14px;
  }
  .receipt-row:last-child { border-bottom: none; }
  .wallet-change { font-size: 18px; font-weight: 700; }
  .wallet-up { color: #22c55e; }
  .wallet-down { color: #ef4444; }

  /* Live indicator */
  .live-dot {
    width: 8px; height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
    display: inline-block;
  }

  /* Spinner */
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(34,197,94,0.2);
    border-top-color: #22c55e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }

  /* Steps progress bar */
  .steps-wrap {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 28px;
  }
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
  }
  .step-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    border: 2px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #64748b;
    z-index: 1;
    transition: all 0.4s;
  }
  .step-circle.active  { border-color: #22c55e; color: #22c55e; background: rgba(34,197,94,0.1); }
  .step-circle.done    { border-color: #22c55e; background: #22c55e; color: #000; }
  .step-circle.error   { border-color: #ef4444; background: rgba(239,68,68,0.1); color: #ef4444; }
  .step-label { font-size: 11px; color: #64748b; margin-top: 6px; text-align: center; }
  .step-connector {
    position: absolute;
    top: 18px;
    left: calc(50% + 18px);
    width: calc(100% - 36px);
    height: 2px;
    background: rgba(255,255,255,0.08);
    z-index: 0;
  }
  .step-connector.done { background: #22c55e; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr 1fr; } }
  .kpi-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 16px;
  }
  .kpi-label { font-size: 11px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 22px; font-weight: 700; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; }
  .kpi-sub   { font-size: 11px; color: #475569; margin-top: 2px; }
`;

const PHASE_LABELS = ['Identity', 'Consent', 'DISCOM Verify', 'Settlement'];

export default function IESTradePage() {
  const [user, setUser]                   = useState(null);
  const [listings, setListings]           = useState([]);
  const [meterState, setMeterState]       = useState(null);
  const [iesId, setIesId]                 = useState(null);
  const [logs, setLogs]                   = useState([]);
  const [phase, setPhase]                 = useState(0); // 0=idle, 1=initiating, 2=awaiting_consent, 3=verifying, 4=settling, 5=done, -1=error
  const [activeTrade, setActiveTrade]     = useState(null);
  const [pendingConsents, setPendingConsents] = useState([]);
  const [receipt, setReceipt]             = useState(null);
  const [showConsent, setShowConsent]     = useState(null);
  const [buyForm, setBuyForm]             = useState({ listingId: '', units: '' });
  const [loading, setLoading]             = useState(false);
  const [tickerItems, setTickerItems]     = useState([]);

  const consoleRef  = useRef(null);
  const socketRef   = useRef(null);
  const pollTimerRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    loadListings();
    loadIESIdentity();
    loadTelemetry();
    pollPendingConsents();

    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Socket via global (injected by index.js or App.js)
  useEffect(() => {
    const s = window.__socket;
    if (!s) return;
    socketRef.current = s;

    s.on('telemetry:update', (data) => {
      const uid = JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (uid && data.meters?.[uid]) {
        setMeterState(data.meters[uid]);
        updateTicker(data.meters[uid]);
      }
    });

    s.on('ies:log', ({ tradeId, logs: newLogs }) => {
      setLogs(prev => [...prev, ...newLogs.filter(l => !prev.find(p => p.event === l.event))]);
    });

    s.on('ies:consent_request', (consent) => {
      setPendingConsents(prev => [consent, ...prev.filter(c => c.consentId !== consent.consentId)]);
      setShowConsent(consent);
    });

    s.on('ies:trade_update', ({ tradeId, status }) => {
      if (status === 'consent_approved') setPhase(3);
      if (status === 'discom_verified')  setPhase(4);
      if (status === 'consent_rejected') setPhase(-1);
    });

    s.on('ies:settlement', (data) => {
      setPhase(5);
      setReceipt(data);
      addLog({ event: `[IES] 🎉 Settlement complete! ${data.txnHash}`, level: 'success' });
      loadListings();
    });

    return () => {
      s.off('telemetry:update');
      s.off('ies:log');
      s.off('ies:consent_request');
      s.off('ies:trade_update');
      s.off('ies:settlement');
    };
  }, []);

  const addLog = (entry) => {
    setLogs(prev => [...prev, { time: new Date().toISOString(), ...entry }]);
  };

  const updateTicker = (state) => {
    setTickerItems([
      `⚡ Generation: ${state.generationKw} kW`,
      `🏠 Consumption: ${state.consumptionKw} kW`,
      `📤 Surplus: ${state.surplusKw} kW`,
      `🌱 Export Today: ${state.totalExportToday?.toFixed(2)} kWh`,
    ]);
  };

  const loadListings = async () => {
    try {
      const res = await api.getListings();
      if (res.success) setListings(res.listings || []);
    } catch (_) {}
  };

  const loadIESIdentity = async () => {
    try {
      const data = await api.getIESIdentity();
      if (data.success) setIesId(data.iesId);
    } catch (_) {}
  };

  const loadTelemetry = async () => {
    try {
      const data = await api.getTelemetry();
      if (data.success && data.meterState) {
        setMeterState(data.meterState);
        updateTicker(data.meterState);
      }
    } catch (_) {}
  };

  const pollPendingConsents = () => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await api.getPendingConsents();
        if (data.success && data.consents?.length > 0) {
          setPendingConsents(data.consents);
          // Use functional updater to avoid stale closure on showConsent
          setShowConsent(prev => prev ? prev : data.consents[0]);
        }
      } catch (_) {}
    }, 5000); // Poll every 5s (was 8s) for snappier demo
  };

  // ── Phase 1: Initiate Trade ───────────────────────────────────────────────
  const initiateTrade = async () => {
    if (!buyForm.listingId || !buyForm.units) return;
    setLoading(true);
    setPhase(1);
    setLogs([]);
    setReceipt(null);
    addLog({ event: `[IES] Initiating P2P trade request...`, level: 'info' });

    try {
      const data = await api.initiateIESTrade(buyForm.listingId, parseFloat(buyForm.units));

      if (data.success) {
        setActiveTrade(data);
        setPhase(2);
        addLog({ event: `[IES] Trade ID: ${data.tradeId}`, level: 'info' });
        addLog({ event: `[IES] Consent ID: ${data.consentId} — awaiting seller approval`, level: 'info' });
      } else {
        setPhase(-1);
        addLog({ event: `[IES] ❌ ${data.message}`, level: 'error' });
      }
    } catch (err) {
      setPhase(-1);
      addLog({ event: `[IES] ❌ Network error: ${err.message}`, level: 'error' });
    }

    setLoading(false);
  };

  // ── Phase 2: Seller consents ──────────────────────────────────────────────
  const handleConsent = async (consent, decision) => {
    setShowConsent(null);
    addLog({ event: `[IES] Seller ${decision === 'approve' ? 'approving' : 'rejecting'} consent ${consent.consentId}...`, level: 'info' });

    try {
      const data = await api.approveConsent(consent.consentId, decision);

      if (decision === 'approve') {
        setPhase(3);
        addLog({ event: `[IES] ✅ Consent approved. Digital signature created.`, level: 'success' });
        addLog({ event: `[IES] Sending to DISCOM for meter log verification...`, level: 'info' });
      } else {
        setPhase(-1);
        addLog({ event: `[IES] ❌ Consent rejected. Trade cancelled.`, level: 'error' });
      }
    } catch (err) {
      addLog({ event: `[IES] ❌ Error: ${err.message}`, level: 'error' });
    }

    setPendingConsents(prev => prev.filter(c => c.consentId !== consent.consentId));
  };

  const selectedListing = listings.find(l => l._id === buyForm.listingId);
  const totalCost = selectedListing && buyForm.units
    ? (parseFloat(buyForm.units) * selectedListing.pricePerUnit).toFixed(2)
    : null;

  const stepStatus = (idx) => {
    if (phase === -1 && idx === phase) return 'error';
    if (idx < phase) return 'done';
    if (idx === phase) return 'active';
    return 'idle';
  };

  // Map phase 0–5 to step index 0–3 (4 steps total)
  const currentStep = phase === -1 ? (activeTrade ? 1 : 0)
    : phase >= 5 ? 3
    : phase >= 4 ? 3
    : phase >= 3 ? 2
    : phase >= 2 ? 1
    : 0;

  return (
    <div className="ies-wrap">
      <style>{CSS}</style>

      {/* Header */}
      <div className="ies-header">
        <span className="ies-badge">IES LIVE</span>
        <div>
          <div className="ies-title">P2P Energy Exchange</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {iesId ? `Identity: ${iesId}` : 'Loading identity...'} &nbsp;·&nbsp;
            <span className="live-dot" /> Live Telemetry
          </div>
        </div>
      </div>

      {/* Live Ticker */}
      {tickerItems.length > 0 && (
        <div className="ticker-wrap">
          <div className="ticker-label">LIVE METER</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="ticker-inner">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={i} className="ticker-item">{item}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {meterState && (
        <div className="kpi-grid">
          <div className="kpi-card" style={{ borderColor: 'rgba(234,179,8,0.2)' }}>
            <div className="kpi-label">☀️ Solar Generation</div>
            <div className="kpi-value" style={{ color: '#eab308' }}>{meterState.generationKw} kW</div>
            <div className="kpi-sub">Real-time output</div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
            <div className="kpi-label">🏠 House Load</div>
            <div className="kpi-value" style={{ color: '#3b82f6' }}>{meterState.consumptionKw} kW</div>
            <div className="kpi-sub">Current draw</div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
            <div className="kpi-label">📤 Surplus / Export</div>
            <div className="kpi-value" style={{ color: meterState.surplusKw > 0 ? '#22c55e' : '#ef4444' }}>
              {meterState.surplusKw} kW
            </div>
            <div className="kpi-sub">Available to trade</div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="steps-wrap">
        {PHASE_LABELS.map((label, idx) => (
          <div className="step-item" key={idx}>
            {idx < PHASE_LABELS.length - 1 && (
              <div className={`step-connector ${currentStep > idx ? 'done' : ''}`} />
            )}
            <div className={`step-circle ${
              phase === -1 && currentStep === idx ? 'error'
              : currentStep > idx ? 'done'
              : currentStep === idx ? 'active'
              : ''
            }`}>
              {currentStep > idx ? '✓' : idx + 1}
            </div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="ies-grid">
        {/* Buy Form */}
        <div className={`phase-card ${phase === 0 ? 'active' : phase > 0 ? 'completed' : ''}`}>
          <div className="phase-num">PHASE 01</div>
          <div className="phase-name">🛒 Initiate Energy Purchase</div>

          {phase === 0 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Select Seller Listing</label>
                <select
                  value={buyForm.listingId}
                  onChange={e => setBuyForm(f => ({ ...f, listingId: e.target.value }))}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none'
                  }}
                >
                  <option value="">Choose a listing...</option>
                  {listings.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.seller?.name} — {l.units} kWh @ ₹{l.pricePerUnit}/kWh
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Units to Buy (kWh)</label>
                <input
                  type="number" min="0.1" step="0.1"
                  value={buyForm.units}
                  onChange={e => setBuyForm(f => ({ ...f, units: e.target.value }))}
                  placeholder="e.g. 5"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {totalCost && (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Total Cost</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', fontFamily: 'JetBrains Mono' }}>₹{totalCost}</div>
                </div>
              )}

              <button className="ies-btn ies-btn-green" style={{ width: '100%' }} onClick={initiateTrade} disabled={loading || !buyForm.listingId || !buyForm.units}>
                {loading ? <><span className="spinner" /> Initiating...</> : '⚡ Initiate P2P Trade'}
              </button>
            </>
          )}

          {phase === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#22c55e' }}>
              <span className="spinner" />
              <span>Sending trade request to IES...</span>
            </div>
          )}

          {phase >= 2 && activeTrade && (
            <div style={{ fontSize: 13, color: '#64748b' }}>
              <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 8 }}>✅ Request Sent</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                Trade: {activeTrade.tradeId?.substring(0, 20)}...<br />
                Consent: {activeTrade.consentId}
              </div>
            </div>
          )}
        </div>

        {/* Seller Consent Panel */}
        <div className={`phase-card ${phase === 2 ? 'active' : phase > 2 ? 'completed' : ''}`}>
          <div className="phase-num">PHASE 02</div>
          <div className="phase-name">🤝 DEPA Consent Gate</div>

          {phase < 2 && (
            <div style={{ color: '#475569', fontSize: 13 }}>Waiting for trade initiation...</div>
          )}

          {phase === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span className="spinner" />
                <span style={{ color: '#f59e0b', fontSize: 13 }}>Awaiting seller's digital consent...</span>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 12, fontSize: 12, color: '#94a3b8' }}>
                🔔 A consent request has been sent to <strong style={{ color: '#f1f5f9' }}>{activeTrade?.sellerName}</strong>.<br />
                They must digitally sign to authorise the trade.
              </div>

              {/* Demo: seller self-approve button */}
              {pendingConsents.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>📱 Seller's Device (Demo)</div>
                  {pendingConsents.map(c => (
                    <div key={c.consentId} style={{ display: 'flex', gap: 8 }}>
                      <button className="ies-btn ies-btn-green" style={{ flex: 1, fontSize: 13 }} onClick={() => handleConsent(c, 'approve')}>✅ Approve</button>
                      <button className="ies-btn ies-btn-red" style={{ flex: 1, fontSize: 13 }} onClick={() => handleConsent(c, 'reject')}>❌ Reject</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {phase === 3 && (
            <div style={{ color: '#22c55e', fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✅ Consent Approved</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="spinner" />
                <span style={{ color: '#f59e0b' }}>DISCOM verifying meter logs...</span>
              </div>
            </div>
          )}

          {phase >= 4 && (
            <div style={{ color: '#22c55e', fontSize: 13 }}>✅ Consent & Meter Verified</div>
          )}
        </div>
      </div>

      {/* IES Console */}
      <div className="console-wrap">
        <div className="console-header">
          <div className="console-dot" style={{ background: '#ef4444' }} />
          <div className="console-dot" style={{ background: '#f59e0b' }} />
          <div className="console-dot" style={{ background: '#22c55e' }} />
          <span className="console-title">IES SYSTEM LOG — REAL-TIME TRADE ORCHESTRATOR</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono' }}>
            {logs.length} events
          </span>
        </div>
        <div className="console-body" ref={consoleRef}>
          {logs.length === 0 ? (
            <div style={{ color: '#334155', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
              Waiting for trade activity...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`log-line log-${log.level || 'info'}`}>
                <span className="log-time">[{new Date(log.time).toLocaleTimeString()}]</span>
                {log.event}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settlement Receipt */}
      {phase === 5 && receipt && (
        <div className="receipt-wrap">
          <div style={{ fontSize: 24, marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: '#22c55e', marginBottom: 8 }}>Trade Successful!</div>
          
          <div className="receipt-hash">{receipt.txnHash}</div>
          
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Energy Traded</span>
            <span style={{ fontWeight: 700 }}>{receipt.units} kWh</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Settlement Amount</span>
            <span style={{ fontWeight: 700 }}>₹{receipt.totalAmount}</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Seller Wallet</span>
            <span className="wallet-change wallet-up">₹{receipt.sellerNewWallet?.toFixed(2)} ↑</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Buyer Wallet</span>
            <span className="wallet-change wallet-down">₹{receipt.buyerNewWallet?.toFixed(2)} ↓</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>CO₂ Offset</span>
            <span style={{ color: '#22c55e' }}>~{(receipt.units * 0.82).toFixed(2)} kg 🌱</span>
          </div>

          <button
            className="ies-btn ies-btn-ghost"
            style={{ marginTop: 16, width: '100%' }}
            onClick={() => { setPhase(0); setReceipt(null); setLogs([]); setActiveTrade(null); setBuyForm({ listingId: '', units: '' }); }}
          >
            + New Trade
          </button>
        </div>
      )}

      {/* Consent Modal (for sellers) */}
      {showConsent && (
        <div className="consent-overlay" onClick={() => setShowConsent(null)}>
          <div className="consent-modal" onClick={e => e.stopPropagation()}>
            <div className="consent-icon">⚡</div>
            <div className="consent-title">DEPA Consent Request</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
              A buyer wants to purchase energy from your solar meter. Review and approve to authorise.
            </div>
            <div className="consent-detail">
              <div className="consent-row">
                <span className="consent-label">Consent ID</span>
                <span className="consent-value" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{showConsent.consentId?.substring(0, 16)}...</span>
              </div>
              <div className="consent-row">
                <span className="consent-label">Units Requested</span>
                <span className="consent-value">{showConsent.units} kWh</span>
              </div>
              <div className="consent-row">
                <span className="consent-label">Expires</span>
                <span className="consent-value">{showConsent.expiresAt ? new Date(showConsent.expiresAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="ies-btn ies-btn-green" style={{ flex: 1 }} onClick={() => handleConsent(showConsent, 'approve')}>
                ✅ Approve & Sign
              </button>
              <button className="ies-btn ies-btn-red" style={{ flex: 1 }} onClick={() => handleConsent(showConsent, 'reject')}>
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
