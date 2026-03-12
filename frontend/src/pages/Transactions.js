import { useState, useEffect } from 'react';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .um-card { transition:transform 0.2s ease,box-shadow 0.2s ease; }
  .um-card:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(180,130,0,0.13) !important; }
  .um-row { transition:background 0.15s; }
  .um-row:hover { background:#fffdf0 !important; }
  .pill:hover { opacity:0.8; }
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
        setTransactions(res.transactions.map(t=>({
          ...t,
          type: t.transactionType==='purchase'?'bought':'sold',
          person: t.transactionType==='purchase'?t.seller?.name||'Unknown':t.buyer?.name||'Unknown',
          amount: t.totalAmount,
          time: new Date(t.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
          status: t.status,
        })));
      } else setError(res.message||'Failed to fetch');
    } catch { setError('Error fetching transactions'); }
    finally { setLoading(false); }
  };

  const totalEarned = transactions.filter(t=>t.type==='sold').reduce((s,t)=>s+t.amount,0);
  const totalSpent  = transactions.filter(t=>t.type==='bought').reduce((s,t)=>s+t.amount,0);
  const totalUnits  = transactions.reduce((s,t)=>s+t.units,0);
  const net         = totalEarned - totalSpent;

  const filtered = transactions.filter(t=>{
    if (filter==='sold') return t.type==='sold';
    if (filter==='bought') return t.type==='bought';
    return true;
  });

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#fffdf5', minHeight:'100vh' }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(160deg,#fffbe6 0%,#fef3c7 45%,#fde68a 100%)', padding:'36px 24px 28px', position:'relative', overflow:'hidden', borderBottom:'1px solid #fde68a' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(250,204,21,0.2) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <p style={{ margin:'0 0 4px', fontSize:11, color:'#92740a', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Urjamitra</p>
          <h1 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, color:'#451a03', letterSpacing:-0.5 }}>📊 Transaction History</h1>
          <p style={{ margin:0, fontSize:12, color:'#a16207' }}>All your energy trades at a glance</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:14, padding:'12px 16px', marginBottom:16, fontSize:13 }}>❌ {error}</div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:36, marginBottom:12, animation:'blink 1.5s infinite' }}>☀️</div>
            <p style={{ color:'#a16207', fontSize:14, fontWeight:500 }}>Loading your transactions…</p>
          </div>
        ) : transactions.length===0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', background:'#fff', borderRadius:22, border:'1.5px solid #fde68a' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p style={{ color:'#a16207', fontSize:14, fontWeight:500 }}>No transactions yet. Start trading energy!</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { label:'Total Earned', val:`₹${totalEarned}`, sub:'from selling energy', bg:'#f0fdf4', border:'#86efac', accent:'#15803d', sub2:'#16a34a' },
                { label:'Total Spent',  val:`₹${totalSpent}`,  sub:'on buying energy',   bg:'#f0f9ff', border:'#bae6fd', accent:'#0369a1', sub2:'#0284c7' },
                { label:'Units Traded', val:`${totalUnits} kWh`,sub:'total traded',       bg:'#fffbeb', border:'#fcd34d', accent:'#b45309', sub2:'#d97706' },
              ].map(s=>(
                <div key={s.label} className="um-card" style={{ background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin:'0 0 4px', fontSize:11, color:s.sub2, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</p>
                  <p style={{ margin:'0 0 4px', fontSize:26, fontWeight:900, color:s.accent, letterSpacing:-1 }}>{s.val}</p>
                  <p style={{ margin:0, fontSize:11, color:s.sub2 }}>{s.sub} ⚡</p>
                </div>
              ))}
            </div>

            {/* Net position */}
            <div style={{ background: net>=0?'#f0fdf4':'#fef2f2', border:`1.5px solid ${net>=0?'#86efac':'#fca5a5'}`, borderRadius:18, padding:'18px 22px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:'0 0 3px', fontSize:11, color:'#a16207', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Net Position This Month</p>
                <p style={{ margin:0, fontSize:18, fontWeight:800, color:net>=0?'#15803d':'#b91c1c' }}>
                  {net>=0 ? `You're ₹${net} ahead! 🎉` : `Net spend: ₹${Math.abs(net)}`}
                </p>
              </div>
              <div style={{ fontSize:32 }}>{net>=0?'💰':'📉'}</div>
            </div>

            {/* Filters */}
            <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
              {[['all','All'],['sold','↑ Sold'],['bought','↓ Bought']].map(([k,l])=>(
                <button key={k} className="pill" onClick={()=>setFilter(k)} style={{ padding:'8px 18px', borderRadius:99, border:'1.5px solid', borderColor:filter===k?'#d97706':'#fde68a', background:filter===k?'linear-gradient(135deg,#f59e0b,#d97706)':'#fff', color:filter===k?'#fff':'#a16207', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                  {l}
                </button>
              ))}
              <button style={{ marginLeft:'auto', padding:'8px 18px', borderRadius:99, border:'1.5px solid #fde68a', background:'#fff', color:'#a16207', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                ⬇ Export
              </button>
            </div>

            {/* List */}
            <div className="um-card" style={{ background:'#fff', border:'1.5px solid #fde68a', borderRadius:22, overflow:'hidden', boxShadow:'0 4px 16px rgba(180,130,0,0.07)', marginBottom:16 }}>
              {filtered.map((t,i)=>(
                <div key={t.id||i} className="um-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:i<filtered.length-1?'1px solid #fef9c3':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:13, background:t.type==='sold'?'#dcfce7':'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:t.type==='sold'?'#16a34a':'#2563eb', fontSize:17 }}>
                      {t.type==='sold'?'↑':'↓'}
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#451a03' }}>
                        {t.type==='sold'?`Sold to ${t.person}`:`Bought from ${t.person}`}
                      </p>
                      <p style={{ margin:'2px 0 0', fontSize:11, color:'#a16207' }}>{t.time} · {t.units} kWh</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:t.type==='sold'?'#15803d':'#1d4ed8' }}>
                      {t.type==='sold'?'+':'-'}₹{t.amount}
                    </p>
                    <p style={{ margin:0, fontSize:11, color:'#a16207' }}>✅ {t.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CO₂ Impact */}
            <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #86efac', borderRadius:22, padding:'22px 24px' }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:800, color:'#14532d' }}>🌿 Your Environmental Impact</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  [`${(totalUnits*0.82).toFixed(1)} kg`,'CO₂ Saved'],
                  [`${totalUnits} kWh`,'Clean Energy Traded'],
                  [`${Math.max(1,Math.round(totalUnits*0.82/21))} 🌳`,'Trees Equivalent'],
                ].map(([v,l])=>(
                  <div key={l} style={{ background:'rgba(255,255,255,0.6)', borderRadius:14, padding:'14px', textAlign:'center', border:'1px solid rgba(134,239,172,0.5)' }}>
                    <p style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#15803d', letterSpacing:-0.5 }}>{v}</p>
                    <p style={{ margin:0, fontSize:11, color:'#16a34a', fontWeight:500 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}