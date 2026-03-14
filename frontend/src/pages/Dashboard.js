import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes barGrow   { from{width:0%} to{width:var(--w)} }
  @keyframes sunBob    { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-10px) rotate(3deg)} }
  @keyframes sunGlow   { 0%,100%{filter:drop-shadow(0 4px 16px rgba(245,158,11,0.5))} 50%{filter:drop-shadow(0 4px 36px rgba(245,158,11,0.9))} }
  @keyframes raysSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes eyeBlink  { 0%,88%,100%{transform:scaleY(1)} 94%{transform:scaleY(0.08)} }
  @keyframes cheekPop  { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.2)} }
  @keyframes smileWig  { 0%,100%{transform:scaleX(1) translateX(0)} 50%{transform:scaleX(1.1) translateX(1px)} }
  
  /* Missing keyframes restored here: */
  @keyframes fadeInDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes growUp    { from { height: 0; opacity: 0; } to { opacity: 1; } }

  /* Sidebar Styles */
  .um-sidebar { width: 280px; background: #fffdf5; border-right: 1.5px solid #fde68a; height: 100vh; display: flex; flex-direction: column; padding: 32px 0 24px; z-index: 40; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); flex-shrink: 0; }
  .sidebar-link { display: flex; align-items: center; gap: 14px; padding: 14px 28px; color: #92400e; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.2s; border-right: 4px solid transparent; cursor: pointer; margin-bottom: 4px; }
  .sidebar-link:hover { background: rgba(245,158,11,0.08); color: #b45309; }
  .sidebar-link.active { background: linear-gradient(90deg, rgba(253,230,138,0.3), rgba(253,230,138,0.1)); border-right-color: #f59e0b; color: #d97706; }
  .sidebar-logo { display:flex; align-items:center; gap:12px; padding:0 28px; margin-bottom:48px; }
  
  .um-sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(120,80,0,0.4); z-index: 30; backdrop-filter: blur(4px); animation: fadeIn 0.3s ease; }
  .mobile-menu-btn { display: none; background: rgba(255,255,255,0.85); border: 1.5px solid #fde68a; border-radius: 12px; width: 44px; height: 44px; cursor: pointer; color: #92400e; align-items: center; justify-content: center; backdrop-filter: blur(8px); box-shadow: 0 4px 12px rgba(180,130,0,0.1); position: absolute; top: 24px; left: 24px; z-index: 20; transition: transform 0.2s, background 0.2s; }
  .mobile-menu-btn:hover { background: #fffbeb; transform: scale(1.05); }
  
  @media (max-width: 900px) {
    .um-sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); width: 280px; background: #fffdf5; box-shadow: 12px 0 40px rgba(180,130,0,0.15); }
    .um-sidebar.open { transform: translateX(0); }
    .um-sidebar-overlay { display: block; }
    .mobile-menu-btn { display: flex; }
    .header-content-inner { padding-left: 64px !important; }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* Premium Glassmorphism & Native Physics */
  .um-card { 
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    background: rgba(255, 255, 255, 0.65) !important;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.8) !important;
  }
  .um-card:hover { 
    transform: translateY(-4px) scale(1.01); 
    box-shadow: 0 24px 48px rgba(180,130,0,0.08), 0 0 0 1px rgba(255,255,255,1) !important; 
    z-index: 10; 
  }
  .um-card-icon { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .um-card:hover .um-card-icon { transform: scale(1.12) rotate(4deg); }

  .um-row { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border-radius: 12px; }
  .um-row:hover { background: rgba(255,255,255,0.8) !important; transform: translateX(6px); box-shadow: -4px 0 0 #f59e0b; }
  
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
  
  .two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 768px) { .two-col-grid { grid-template-columns: 1fr; } }

  .three-col-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 768px) { .three-col-grid { grid-template-columns: 1fr; } }
  
  .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
  @media (max-width: 600px) { .header-content { flex-direction: column-reverse; gap: 24px; align-items: center; text-align: center; } }
  
  @keyframes shine { 100% { left: 150%; } }
  .gradient-btn { background: linear-gradient(135deg, #f59e0b, #ea580c); color: #fff; border: none; border-radius: 20px; padding: 18px 24px; font-weight: 800; font-size: 15px; letter-spacing: -0.2px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; overflow: hidden; }
  .gradient-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); transition: 0s; }
  .gradient-btn:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 16px 32px rgba(234, 88, 12, 0.35); }
  .gradient-btn:hover::after { animation: shine 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  
  .ghost-btn { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #9A3412; border: 1.5px solid rgba(253,230,138,0.8); border-radius: 20px; padding: 18px 24px; font-weight: 800; font-size: 15px; letter-spacing: -0.2px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center; gap: 10px; }
  .ghost-btn:hover { background: #fff; border-color: #f59e0b; transform: translateY(-4px) scale(1.02); box-shadow: 0 16px 32px rgba(253, 230, 138, 0.4); }
`;

function CountUp({ end, prefix = '', suffix = '', decimals = 0, duration = 1200 }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(ease * end);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const displayVal = decimals ? val.toFixed(decimals) : Math.round(val);
  return <span>{prefix}{displayVal}{suffix}</span>;
}

const fallbackWeekly = [
  { d: 'S', g: 0, s: 0 },
  { d: 'M', g: 0, s: 0 },
  { d: 'T', g: 0, s: 0 },
  { d: 'W', g: 0, s: 0 },
  { d: 'T', g: 0, s: 0 },
  { d: 'F', g: 0, s: 0 },
  { d: 'S', g: 0, s: 0 },
];

function SunIcon({ size = 72 }) {
  const r = size / 2;
  const numRays = 12;
  return (
    <div style={{ animation: 'sunBob 3.5s ease-in-out infinite', display: 'inline-block' }}>
      <svg width={size * 2.2} height={size * 2.2} viewBox={`0 0 ${size * 2.2} ${size * 2.2}`} style={{ animation: 'sunGlow 3s ease-in-out infinite', overflow: 'visible' }}>
        <g transform={`translate(${size * 1.1},${size * 1.1})`}>
          {/* Spinning rays */}
          <g style={{ animation: 'raysSpin 18s linear infinite', transformOrigin: '0 0' }}>
            {Array.from({ length: numRays }).map((_, i) => {
              const angle = (i / numRays) * Math.PI * 2;
              const inner = r + 6, outer = r + 18;
              return (
                <line key={i}
                  x1={Math.cos(angle) * inner} y1={Math.sin(angle) * inner}
                  x2={Math.cos(angle) * outer} y2={Math.sin(angle) * outer}
                  stroke={i % 2 === 0 ? '#f59e0b' : '#fbbf24'} strokeWidth={i % 2 === 0 ? 3 : 2} strokeLinecap="round"
                />
              );
            })}
          </g>
          {/* Glow halo */}
          <circle r={r + 4} fill="rgba(250,204,21,0.18)" />
          {/* Main face circle */}
          <circle r={r} fill="url(#sunGrad)" />
          <defs>
            <radialGradient id="sunGrad" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
          </defs>
          {/* Eyes */}
          <ellipse cx={-r * 0.28} cy={-r * 0.12} rx={r * 0.11} ry={r * 0.13}
            fill="#92400e" style={{ animation: 'eyeBlink 4s ease-in-out infinite', transformOrigin: `${-r * 0.28}px ${-r * 0.12}px` }} />
          <ellipse cx={r * 0.28} cy={-r * 0.12} rx={r * 0.11} ry={r * 0.13}
            fill="#92400e" style={{ animation: 'eyeBlink 4s ease-in-out infinite 0.08s', transformOrigin: `${r * 0.28}px ${-r * 0.12}px` }} />
          {/* Eye shine */}
          <circle cx={-r * 0.22} cy={-r * 0.18} r={r * 0.04} fill="white" opacity="0.9" />
          <circle cx={r * 0.34} cy={-r * 0.18} r={r * 0.04} fill="white" opacity="0.9" />
          {/* Rosy cheeks */}
          <ellipse cx={-r * 0.44} cy={r * 0.18} rx={r * 0.2} ry={r * 0.12}
            fill="#f87171" opacity="0.5" style={{ animation: 'cheekPop 3s ease-in-out infinite' }} />
          <ellipse cx={r * 0.44} cy={r * 0.18} rx={r * 0.2} ry={r * 0.12}
            fill="#f87171" opacity="0.5" style={{ animation: 'cheekPop 3s ease-in-out infinite 0.4s' }} />
          {/* Smile */}
          <path
            d={`M ${-r * 0.35} ${r * 0.22} Q 0 ${r * 0.55} ${r * 0.35} ${r * 0.22}`}
            fill="none" stroke="#92400e" strokeWidth={r * 0.1} strokeLinecap="round"
            style={{ animation: 'smileWig 3.5s ease-in-out infinite', transformOrigin: '0 0' }}
          />
        </g>
      </svg>
    </div>
  );
}

function MiniChart({ data }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.g, d.s)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 68 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(d.g / max) * 52}px`, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.15)', animation: `growUp 0.8s cubic-bezier(0.1,0.7,0.1,1) ${i * 0.05}s backwards` }} />
            <div style={{ width: '60%', borderRadius: '3px 3px 0 0', height: `${(d.s / max) * 52}px`, background: '#6dbb85', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', animation: `growUp 0.8s cubic-bezier(0.1,0.7,0.1,1) ${i * 0.05 + 0.1}s backwards` }} />
          </div>
          <span style={{ fontSize: 9, color: '#b8a36e', fontWeight: 700 }}>{d.d}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [listing, setListing] = useState({ units: '', price: '' });
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [kwh, setKwh] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [communityStats, setCommunityStats] = useState({
    monthlyGoal: 20000,
    monthlySavings: 0,
    totalSharedKwh: 0,
    activeHomes: 0,
    totalCo2Saved: 0,
    communityRank: null,
    communitySize: 0,
    weekly: fallbackWeekly,
  });
  const [localUser] = useState(() => JSON.parse(localStorage.getItem('user')) || { name: 'Arjun' });
  const [recentActivity, setRecentActivity] = useState([]);

  const currentUserId = localUser?.id || localUser?._id || null;

  const formatActivityTime = (isoDate) => {
    if (!isoDate) return 'Just now';
    const dt = new Date(isoDate);
    const now = new Date();
    const diffMs = now - dt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const statusLabel = (status) => {
    const map = {
      completed: 'Completed',
      reserved: 'Awaiting seller',
      seller_accepted: 'Accepted',
      seller_rejected: 'Rejected',
      in_delivery: 'In delivery',
      cancelled: 'Cancelled',
      expired: 'Expired',
      refunded: 'Refunded',
      pending: 'Pending',
      pending_request: 'Pending'
    };
    return map[status] || String(status || 'Pending');
  };

  const isSettledStatus = (status) => status === 'completed';
  const isNeutralStatus = (status) => ['seller_rejected', 'refunded', 'cancelled', 'expired'].includes(status);

  const loadRecentActivity = useCallback(async () => {
    try {
      const txRes = await api.getMyTransactionsV2({ page: 1, limit: 8 });
      if (!txRes.success || !Array.isArray(txRes.items)) return;

      const mapped = txRes.items
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map((t) => {
          const isSold = String(t.seller?._id || t.seller) === String(currentUserId);
          const counterpart = isSold
            ? (t.buyer?.name || 'Unknown buyer')
            : (t.seller?.name || 'Unknown seller');
          const txStatus = t.status;
          const baseAmount = Number(t.totalAmount || t.grossAmount || 0);
          const amountText = isSettledStatus(txStatus)
            ? `${isSold ? '+' : '-'}₹${baseAmount.toFixed(2)}`
            : isNeutralStatus(txStatus)
              ? '₹0.00'
              : `₹${baseAmount.toFixed(2)}`;

          return {
            type: isSold ? 'sold' : 'bought',
            status: txStatus,
            desc: counterpart,
            sub: `${Number(t.units || t.deliveredUnits || t.reservedUnits || 0)} kWh · ${statusLabel(t.status)}`,
            time: formatActivityTime(t.createdAt),
            amount: amountText
          };
        });

      setRecentActivity(mapped);
    } catch {
      // Keep current activity list if refresh fails.
    }
  }, [currentUserId]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const loadProfileAndCommunity = useCallback(async () => {
    const [profileResult, communityResult] = await Promise.allSettled([
      api.getMyProfile(),
      api.getCommunityStats(),
    ]);

    if (profileResult.status === 'fulfilled') {
      const res = profileResult.value;
      if (res.success && res.user) {
        setUserProfile(res.user);
        const generatedKwh = Number(res.user.totalEnergyGenerated || 0);
        const sharedKwh = Number(res.user.totalEnergyShared || 0);
        setKwh(generatedKwh > 0 ? generatedKwh : sharedKwh);

        const merged = { ...localUser, ...res.user };
        localStorage.setItem('user', JSON.stringify(merged));
      }
    } else {
      setKwh(0);
    }

    if (communityResult.status === 'fulfilled') {
      const statsRes = communityResult.value;
      if (statsRes.success && statsRes.stats) {
        const parsedRank = Number(statsRes.stats.communityRank);
        const parsedSize = Number(statsRes.stats.communitySize);
        setCommunityStats({
          monthlyGoal: Number(statsRes.stats.monthlyGoal || 20000),
          monthlySavings: Number(statsRes.stats.monthlySavings || 0),
          totalSharedKwh: Number(statsRes.stats.totalSharedKwh || 0),
          activeHomes: Number(statsRes.stats.activeHomes || 0),
          totalCo2Saved: Number(statsRes.stats.totalCo2Saved || 0),
          communityRank: Number.isFinite(parsedRank) && parsedRank > 0
            ? parsedRank
            : null,
          communitySize: Number.isFinite(parsedSize) && parsedSize > 0
            ? parsedSize
            : 0,
          weekly: Array.isArray(statsRes.stats.weekly) && statsRes.stats.weekly.length
            ? statsRes.stats.weekly
            : fallbackWeekly,
        });
      }
    }
  }, [localUser]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setTimeout(() => setMounted(true), 60);
      await loadProfileAndCommunity();
      loadRecentActivity();
    };

    loadDashboardData();
  }, [loadRecentActivity, loadProfileAndCommunity]);

  useEffect(() => {
    const id = setInterval(() => {
      loadProfileAndCommunity();
      loadRecentActivity();
    }, 20000);

    return () => clearInterval(id);
  }, [loadRecentActivity, loadProfileAndCommunity]);

  const userName = userProfile?.name || localUser.name || 'Arjun';
  const energyShared = Number(userProfile?.totalEnergyShared || 0);
  const liveGenerationKwh = kwh > 0 ? kwh : energyShared;
  const pct = Math.max(0, Math.min(100, Math.round((liveGenerationKwh / 16) * 100)));
  const totalEarnings = Number(userProfile?.totalEarnings || 0);
  const co2SavedRaw = Number(userProfile?.co2Saved || 0);
  const co2Saved = co2SavedRaw > 0 ? co2SavedRaw : Number((energyShared * 0.82).toFixed(1));
  const safeCommunitySize = Number.isFinite(Number(communityStats.communitySize)) && Number(communityStats.communitySize) > 0
    ? Number(communityStats.communitySize)
    : 0;
  const safeCommunityRank = Number.isFinite(Number(communityStats.communityRank)) && Number(communityStats.communityRank) > 0
    ? Number(communityStats.communityRank)
    : (safeCommunitySize > 0 ? 1 : 0);
  const communityRankText = safeCommunitySize > 0
    ? `#${safeCommunityRank}/${safeCommunitySize}`
    : '--';
  const communityGoalPct = Math.max(
    0,
    Math.min(100, Math.round((communityStats.monthlySavings / Math.max(1, communityStats.monthlyGoal)) * 100))
  );

  const postListing = () => {
    if (!listing.units || !listing.price) return;
    setDone(true);
    setTimeout(() => { setShowModal(false); setDone(false); setListing({ units: '', price: '' }); navigate('/marketplace'); }, 1600);
  };

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        paddingBottom: '32px',
        background: 'radial-gradient(ellipse at top right, rgba(253,230,138,0.3), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.3), transparent 70%), #fefaf0',
        backgroundSize: '200% 200%',
        minHeight: '100vh'
      }}>

        {/* ── HEADER ── warm gold gradient, fully light */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(234,88,12,0.05))',
          padding: '36px 24px 64px', position: 'relative', overflow: 'hidden',
          borderBottom: '1px solid rgba(253,230,138,0.5)',
        }}>
          {/* Soft radial glow behind sun */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(250,204,21,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(134,188,114,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div className="header-content-inner header-content" style={{ maxWidth: 960, margin: '0 auto', transition: 'padding 0.3s ease' }}>
            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#92740a', fontWeight: 600, letterSpacing: 0.3 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 style={{ margin: '0 0 10px', fontSize: 34, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -1, lineHeight: 1.1 }}>
                {greeting()}, <span style={{ color: '#b45309' }}>{userName}!</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: window.innerWidth <= 600 ? 'center' : 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'blink 2.5s infinite', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontSize: 13, color: '#15803d', fontWeight: 800 }}>System live · Pune, Maharashtra</span>
              </div>
            </div>
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.2s' }}><SunIcon size={56} /></div>
          </div>

          {/* Live generation card — warm white on gold bg */}
          <div style={{
            maxWidth: 960, margin: '24px auto 0',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.5)', borderRadius: 24,
            padding: '24px 32px',
            opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)',
            transition: 'all 0.6s ease 0.3s',
            boxShadow: '0 12px 40px rgba(180,130,0,0.15), inset 0 0 0 1px rgba(255,255,255,1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#92740a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Live Generation</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: '#b45309', lineHeight: 1, letterSpacing: -1.5 }}>{liveGenerationKwh}</span>
                  <span style={{ fontSize: 17, color: '#d97706', fontWeight: 600 }}>kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '7px 16px', marginBottom: 5 }}>
                  <span style={{ color: '#15803d', fontWeight: 800, fontSize: 14 }}>₹{totalEarnings.toFixed(0)} total earned</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#92740a', fontWeight: 500 }}>Live from your profile data</p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', boxShadow: '0 0 8px rgba(245,158,11,0.4)', transition: 'width 1s ease' }} />
            </div>
            <p style={{ margin: '7px 0 0', fontSize: 12, color: '#92740a', fontWeight: 500 }}>{pct}% of 16 kWh daily target</p>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

          {/* Stats row — overlap header slightly */}
          <div className="stats-grid" style={{ marginTop: -28, marginBottom: 20, position: 'relative', zIndex: 2 }}>
            {[
              { icon: '⚡', val: <CountUp end={energyShared} decimals={1} suffix=" kWh" />, label: 'Energy Shared', accent: '#c2410c', bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fdba74' },
              { icon: '💰', val: <CountUp end={totalEarnings} prefix="₹" />, label: 'Money Earned', accent: '#15803d', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#86efac' },
              { icon: '🌿', val: <CountUp end={co2Saved} decimals={1} suffix=" kg" />, label: 'CO₂ Saved', accent: '#0369a1', bg: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '#7dd3fc' },
              { icon: '🏆', val: communityRankText, label: 'Community Rank', accent: '#6d28d9', bg: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', border: '#d8b4fe' },
            ].map(s => (
              <div key={s.label} className="um-card" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 24, padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="um-card-icon" style={{ fontSize: 24, background: '#fff', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#451a03', letterSpacing: '-1.5px', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#78350f', marginTop: 8, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="two-col-grid" style={{ marginBottom: 16 }}>

            {/* Community savings */}
            <div className="um-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 10, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Community Goal</p>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#14532d', letterSpacing: '-0.5px' }}>Monthly Savings</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d', letterSpacing: -1 }}>₹{communityStats.monthlySavings.toFixed(0)}</div>
                  <div style={{ fontSize: 10, color: '#16a34a' }}>of ₹{communityStats.monthlyGoal.toFixed(0)} goal</div>
                </div>
              </div>
              <div style={{ background: 'rgba(134,239,172,0.4)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ width: `${communityGoalPct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#22c55e,#16a34a)', boxShadow: '0 0 8px rgba(34,197,94,0.3)', transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[[`${communityStats.totalSharedKwh.toFixed(1)} kWh`, 'Shared'], [`${communityStats.activeHomes}`, 'Homes'], [`${communityStats.totalCo2Saved.toFixed(1)} kg`, 'CO₂']].map(([v, l]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(134,239,172,0.5)' }}>
                    <div style={{ color: '#14532d', fontWeight: 800, fontSize: 12 }}>{v}</div>
                    <div style={{ color: '#16a34a', fontSize: 10, marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly chart */}
            <div className="um-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#451a03', letterSpacing: '-0.5px' }}>Weekly Overview</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['rgba(245,158,11,0.3)', 'Generated'], ['#6dbb85', 'Shared']].map(([c, l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: c, border: `1px solid ${c}` }} />
                      <span style={{ fontSize: 10, color: '#92740a', fontWeight: 600 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MiniChart data={communityStats.weekly} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="two-col-grid" style={{ gap: 16, marginBottom: 24 }}>
            <button onClick={() => navigate('/marketplace', { state: { openListModal: true } })} className="gradient-btn">
              <span style={{ fontSize: 22 }}>⚡</span> List My Surplus Energy
            </button>
            <button onClick={() => navigate('/marketplace')} className="ghost-btn">
              <span style={{ fontSize: 22 }}>🏪</span> Browse Marketplace
            </button>
          </div>

          {/* Tip */}
          <div className="um-card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 12px rgba(245, 158, 11, 0.2)' }}>💡</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 900, fontSize: 15, color: '#9a3412', letterSpacing: -0.2 }}>Peak Hours: 11AM – 3PM</p>
              <p style={{ margin: 0, fontSize: 13, color: '#b45309', fontWeight: 500 }}>Best time to sell — earn up to <strong style={{ color: '#ea580c' }}>15% more</strong> per kWh</p>
            </div>
            <button onClick={() => navigate('/marketplace', { state: { openListModal: true } })} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}>
              List Now →
            </button>
          </div>

          {/* Recent activity */}
          <div className="um-card" style={{ marginBottom: 32, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(253,230,138,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#451a03', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.5px' }}><span style={{ fontSize: 22 }}>📋</span> Recent Activity</h2>
              <span style={{ fontSize: 13, color: '#ea580c', fontWeight: 800, cursor: 'pointer', background: 'rgba(255,237,213,0.5)', padding: '6px 12px', borderRadius: 'full' }} onClick={() => navigate('/transactions')}>View all →</span>
            </div>
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} className="um-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < recentActivity.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: isNeutralStatus(a.status) ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : a.type === 'sold' ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: isNeutralStatus(a.status) ? '#b91c1c' : a.type === 'sold' ? '#16a34a' : '#2563eb', fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {isNeutralStatus(a.status) ? '✕' : a.type === 'sold' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{a.desc}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', fontWeight: 500 }}>{a.sub} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> {a.time}</p>
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: isNeutralStatus(a.status) ? '#b91c1c' : a.type === 'sold' ? '#16a34a' : '#2563eb', background: isNeutralStatus(a.status) ? '#fef2f2' : a.type === 'sold' ? '#f0fdf4' : '#f0f9ff', padding: '6px 12px', borderRadius: 8 }}>{a.amount}</span>
              </div>
            )) : (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍃</div>
                <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#451a03' }}>No activity yet</p>
                <p style={{ margin: 0, fontSize: 13, color: '#92740a' }}>List your surplus energy to make your first trade!</p>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="um-card" style={{ padding: '32px', marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, boxShadow: '0 8px 24px rgba(234, 88, 12, 0.3)' }}>☀️</div>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#451a03', letterSpacing: -0.5 }}>About Urjamitra</h2>
                <p style={{ margin: '0 0 16px', fontSize: 15, color: '#9a3412', lineHeight: 1.6, fontWeight: 500 }}>
                  Urjamitra (ऊर्जा मित्र) is essentially a friendly neighborhood energy network. Our goal is to empower local communities to trade surplus solar energy seamlessly, making renewable energy accessible, profitable, and equitable for everyone.
                </p>
                <div className="three-col-grid">
                  {[
                    { t: 'Empowerment', d: 'Giving you control over your energy.' },
                    { t: 'Sustainability', d: 'Reducing carbon footprint together.' },
                    { t: 'Community', d: 'Building stronger, greener neighborhoods.' }
                  ].map(v => (
                    <div key={v.t} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(253,230,138,0.5)', padding: '16px', borderRadius: 16 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#78350f' }}>{v.t}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#9a3412', lineHeight: 1.4 }}>{v.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Support Section */}
          <div className="um-card" style={{ padding: '32px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#451a03', letterSpacing: -0.5 }}>Need Help? Contact Us</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9a3412', fontWeight: 500 }}>
                Our support team is available 24/7 to assist you with trades and technical issues.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href="mailto:neuralknights1234@gmail.com" style={{ textDecoration: 'none', maxWidth: '100%' }}>
                <button className="ghost-btn" style={{ padding: '14px 24px', fontSize: 14, wordBreak: 'break-all', maxWidth: '100%' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>✉️</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>neuralknights1234@gmail.com</span>
                </button>
              </a>
              <button className="gradient-btn" style={{ padding: '14px 24px', fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>📞</span> +91 1800 123 4567
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div style={{ textAlign: 'center', padding: '0 24px 24px', opacity: 0.8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 600, letterSpacing: 0.5 }}>
              © {new Date().getFullYear()} Urjamitra. Crafted with ❤️ by <span style={{ fontWeight: 900, color: '#ea580c' }}>Team NEURAL KNIGHTS _AISSMS IOIT</span>
            </p>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(120,80,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: '#fffdf5', borderRadius: '26px 26px 0 0', padding: '28px 28px 48px', width: '100%', maxWidth: 520, boxShadow: '0 -16px 60px rgba(180,130,0,0.15)', animation: 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)', border: '1.5px solid #fde68a', borderBottom: 'none' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>✅</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#451a03' }}>Listing Posted!</h3>
                  <p style={{ margin: 0, color: '#a16207', fontSize: 13 }}>Visible to 48 neighbors · Redirecting…</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#451a03' }}>⚡ List Surplus Energy</h2>
                      <p style={{ margin: 0, fontSize: 12, color: '#a16207' }}>Your neighbors will see this instantly</p>
                    </div>
                    <button onClick={() => setShowModal(false)} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 99, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#92400e', fontFamily: 'inherit' }}>✕</button>
                  </div>
                  {['units', 'price'].map(f => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#a16207', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {f === 'units' ? 'Energy Amount (kWh)' : 'Price per kWh (₹)'}
                      </label>
                      <input type="number" placeholder={f === 'units' ? 'e.g. 5' : 'e.g. 18'} value={listing[f]}
                        onChange={e => setListing({ ...listing, [f]: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#fde68a'}
                        style={{ width: '100%', border: '1.5px solid #fde68a', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#451a03', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.2s', background: '#fff' }} />
                    </div>
                  ))}
                  {listing.units && listing.price && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '13px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeInDown 0.3s ease' }}>
                      <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>You'll earn</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#15803d' }}>₹{(parseFloat(listing.units) * parseFloat(listing.price) || 0).toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 11, padding: '10px 14px', marginBottom: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>💡 Market rate today: <strong>₹16–20/kWh</strong></p>
                  </div>
                  <button onClick={postListing} disabled={!listing.units || !listing.price} style={{ width: '100%', padding: '17px', background: listing.units && listing.price ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#fef3c7', color: listing.units && listing.price ? '#fff' : '#d97706', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: listing.units && listing.price ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: listing.units && listing.price ? '0 6px 20px rgba(217,119,6,0.35)' : 'none', transition: 'all 0.2s' }}>
                    Post Listing ⚡
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}