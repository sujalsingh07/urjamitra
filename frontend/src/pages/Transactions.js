import { useState, useEffect } from 'react';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  
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

  .pill { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
  .pill:hover:not(.active) { background: rgba(255,255,255,0.9) !important; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(180,130,0,0.08); }

  .um-row { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .um-row:hover { background: rgba(254, 243, 199, 0.3); transform: scale(1.01); box-shadow: 0 4px 12px rgba(180,130,0,0.05); z-index: 5; border-radius: 16px; }
`;

export default function Transactions() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getMyTransactions();
      if (res.success) {
        setTransactions(res.transactions.map(t => ({
          ...t,
          type: t.transactionType === 'purchase' ? 'bought' : 'sold',
          person: t.transactionType === 'purchase' ? t.seller?.name || 'Unknown' : t.buyer?.name || 'Unknown',
          amount: t.totalAmount,
          time: new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: t.status,
        })));
      } else setError(res.message || 'Failed to fetch');
    } catch { setError('Error fetching transactions'); }
    finally { setLoading(false); }
  };

  const totalEarned = transactions.filter(t => t.type === 'sold').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'bought').reduce((s, t) => s + t.amount, 0);
  const totalUnits = transactions.reduce((s, t) => s + t.units, 0);
  const net = totalEarned - totalSpent;

  const filtered = transactions.filter(t => {
    if (filter === 'sold') return t.type === 'sold';
    if (filter === 'bought') return t.type === 'bought';
    return true;
  });

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
        <div style={{ maxWidth: 960, margin: '0 auto', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#92740a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Urjamitra</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>📊 Transaction History</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#92400e', fontWeight: 500 }}>All your energy trades at a glance</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>

        {error && (
          <div className="um-card" style={{ background: 'rgba(254,242,242,0.85)', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 13, animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>❌ {error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: 'blink 1.5s infinite' }}>☀️</div>
            <p style={{ color: '#a16207', fontSize: 15, fontWeight: 600 }}>Loading your transactions…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="um-card" style={{ textAlign: 'center', padding: '80px 0', borderRadius: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ color: '#92400e', fontSize: 15, fontWeight: 600 }}>No transactions yet. Start trading energy!</p>
          </div>
        ) : (
          <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Earned', val: `₹${totalEarned}`, sub: 'from selling energy', bg: 'rgba(240,253,244,0.6)', border: 'rgba(134,239,172,0.5)', accent: '#15803d', sub2: '#16a34a' },
                { label: 'Total Spent', val: `₹${totalSpent}`, sub: 'on buying energy', bg: 'rgba(240,249,255,0.6)', border: 'rgba(186,230,253,0.5)', accent: '#0369a1', sub2: '#0284c7' },
                { label: 'Units Traded', val: `${totalUnits} kWh`, sub: 'total volume', bg: 'rgba(255,251,235,0.6)', border: 'rgba(252,211,77,0.5)', accent: '#b45309', sub2: '#d97706' },
              ].map((s, i) => (
                <div key={s.label} className="um-card" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 24, padding: '24px', animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + (i * 0.05)}s both` }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: s.sub2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2 }}>{s.label}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 900, color: s.accent, fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>{s.val}</p>
                  <p style={{ margin: 0, fontSize: 13, color: s.sub2, fontWeight: 600 }}>{s.sub} ⚡</p>
                </div>
              ))}
            </div>

            {/* Net position */}
            <div className="um-card" style={{ background: net >= 0 ? 'rgba(220,252,231,0.6)' : 'rgba(254,242,242,0.6)', border: `1px solid ${net >= 0 ? 'rgba(134,239,172,0.8)' : 'rgba(252,165,165,0.8)'}`, borderRadius: 24, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2 }}>Net Position This Month</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: net >= 0 ? '#15803d' : '#b91c1c', letterSpacing: -0.5 }}>
                  {net >= 0 ? `You're ₹${net} ahead! 🎉` : `Net spend: ₹${Math.abs(net)}`}
                </p>
              </div>
              <div style={{ fontSize: 40, transform: 'rotate(-5deg)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{net >= 0 ? '💰' : '📉'}</div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
              {[['all', 'All'], ['sold', '↑ Sold'], ['bought', '↓ Bought']].map(([k, l]) => (
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
              <button className="pill" style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: 14, border: '1px solid rgba(253,230,138,0.8)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', color: '#92400e', fontWeight: 800, fontSize: 13 }}>
                ⬇ Export CSV
              </button>
            </div>

            {/* List */}
            <div className="um-card" style={{ borderRadius: 24, overflow: 'hidden', padding: '8px', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both', marginBottom: 24 }}>
              {filtered.map((t, i) => (
                <div key={t.id || i} className="um-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', position: 'relative' }}>
                  {i !== filtered.length - 1 && <div style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(253,230,138,0.5), transparent)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: t.type === 'sold' ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: t.type === 'sold' ? '#16a34a' : '#2563eb', fontSize: 20, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                      {t.type === 'sold' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#451a03' }}>
                        {t.type === 'sold' ? `Sold to ${t.person}` : `Bought from ${t.person}`}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#92400e', fontWeight: 500 }}>{t.time} <span style={{ opacity: 0.5 }}>•</span> <strong style={{ color: '#78350f' }}>{t.units} kWh</strong></p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: t.type === 'sold' ? '#15803d' : '#1d4ed8', letterSpacing: -0.5 }}>
                      {t.type === 'sold' ? '+' : '-'}₹{t.amount}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>{t.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CO₂ Impact */}
            <div className="um-card" style={{ background: 'radial-gradient(ellipse at top right, rgba(220,252,231,0.6), transparent 70%), rgba(255,255,255,0.5)', border: '1px solid rgba(134,239,172,0.8)', borderRadius: 24, padding: '32px', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -50, right: -50, fontSize: 200, opacity: 0.1, pointerEvents: 'none', filter: 'blur(4px)' }}>🌿</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 900, color: '#14532d', letterSpacing: -0.5 }}>🌿 Your Neighborhood Impact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    [`${(totalUnits * 0.82).toFixed(1)} kg`, 'CO₂ Emissions Saved'],
                    [`${totalUnits} kWh`, 'Clean Energy Traded'],
                    [`${Math.max(1, Math.round(totalUnits * 0.82 / 21))} 🌳`, 'Equivalent Trees Planted'],
                  ].map(([v, l]) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '20px', border: '1px solid rgba(134,239,172,0.5)', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <p style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: '#15803d', fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>{v}</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div >
        )
        }
      </div >
    </div >
  );
}