import { useState, useEffect } from 'react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes ping   { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 100%{transform:translate(-50%,-50%) scale(2.4);opacity:0} }
  @keyframes youPing{ 0%{transform:translate(-50%,-50%) scale(1);opacity:0.4} 100%{transform:translate(-50%,-50%) scale(2.2);opacity:0} }
  @keyframes popIn  { from{opacity:0;transform:scale(0.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .marker { transition:transform 0.18s ease; }
  .marker:hover { transform:translate(-50%,-50%) scale(1.18) !important; }
`;

const neighbors = [
  { id:1, name:'Sunita Sharma', house:'House #7',  units:5, price:18, status:'selling', top:'32%', left:'44%', init:'S' },
  { id:2, name:'Anil Mehta',    house:'Flat 4B',   units:3, price:16, status:'selling', top:'58%', left:'67%', init:'A' },
  { id:3, name:'Priya Patel',   house:'House #12', units:8, price:20, status:'selling', top:'22%', left:'72%', init:'P' },
  { id:4, name:'Rajesh Kumar',  house:'Flat 2A',   units:0, price:0,  status:'buying',  top:'68%', left:'28%', init:'R' },
  { id:5, name:'Meera Joshi',   house:'House #3',  units:2, price:17, status:'selling', top:'45%', left:'18%', init:'M' },
];

const markerColor = (n) => {
  if (n.status==='buying') return { bg:'#fca5a5', border:'#ef4444', text:'#7f1d1d' };
  if (n.units<=2)          return { bg:'#fde68a', border:'#f59e0b', text:'#78350f' };
  return                          { bg:'#bbf7d0', border:'#22c55e', text:'#14532d' };
};

export default function MapView() {
  const [selected, setSelected] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(()=>setMounted(true), 60); }, []);

  const handleConnect = () => { setShowSuccess(true); setSelected(null); setTimeout(()=>setShowSuccess(false),3000); };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#fffdf5', minHeight:'100vh' }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(160deg,#fffbe6 0%,#fef3c7 45%,#fde68a 100%)', padding:'36px 24px 28px', position:'relative', overflow:'hidden', borderBottom:'1px solid #fde68a' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(250,204,21,0.2) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <p style={{ margin:'0 0 4px', fontSize:11, color:'#92740a', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Urjamitra</p>
          <h1 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, color:'#451a03', letterSpacing:-0.5 }}>🗺️ Neighborhood Map</h1>
          <p style={{ margin:0, fontSize:12, color:'#a16207' }}>Tap any marker to see energy details and connect</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px' }}>

        {/* Success toast */}
        {showSuccess && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d', borderRadius:14, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:10, animation:'fadeUp 0.3s ease' }}>
            <span style={{ fontSize:18 }}>✅</span> Connection request sent! You'll be notified when confirmed.
          </div>
        )}

        {/* Legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {[['#22c55e','#f0fdf4','Selling Energy'],['#ef4444','#fef2f2','Needs Energy'],['#f59e0b','#fffbeb','Low Stock'],['#f59e0b','#fef9c3','You']].map(([dot,bg,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:7, background:bg, border:`1.5px solid ${dot}44`, borderRadius:99, padding:'7px 14px', fontSize:12, color:'#451a03', fontWeight:600 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:dot }} />{l}
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ position:'relative', background:'linear-gradient(135deg,#fefce8,#f0fdf4,#fffbeb)', borderRadius:24, border:'1.5px solid #fde68a', overflow:'hidden', height:480, boxShadow:'0 8px 32px rgba(180,130,0,0.1)', marginBottom:16 }}>

          {/* Grid */}
          {[20,40,60,80].map(p=><>
            <div key={`h${p}`} style={{ position:'absolute', top:`${p}%`, left:0, right:0, borderTop:'1px solid rgba(180,130,0,0.08)' }} />
            <div key={`v${p}`} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, borderLeft:'1px solid rgba(180,130,0,0.08)' }} />
          </>)}

          {/* Roads */}
          <div style={{ position:'absolute', top:'49%', left:0, right:0, height:13, background:'rgba(245,158,11,0.15)', borderTop:'1px solid rgba(245,158,11,0.2)', borderBottom:'1px solid rgba(245,158,11,0.2)' }} />
          <div style={{ position:'absolute', left:'49%', top:0, bottom:0, width:13, background:'rgba(245,158,11,0.15)', borderLeft:'1px solid rgba(245,158,11,0.2)', borderRight:'1px solid rgba(245,158,11,0.2)' }} />

          {/* Labels */}
          {[['3%','3%',undefined,'Maple Lane'],['3%',undefined,'3%','Rose Garden'],['auto',undefined,'3%','Green Residency']].map(([t,l,r,name])=>(
            <div key={name} style={{ position:'absolute', top:t, left:l, right:r, bottom:t==='auto'?'3%':undefined, fontSize:10, color:'#a16207', fontWeight:700, letterSpacing:0.5 }}>{name}</div>
          ))}

          {/* Range circle */}
          <div style={{ position:'absolute', top:'50%', left:'50%', width:240, height:240, transform:'translate(-50%,-50%)', borderRadius:'50%', border:'1.5px dashed rgba(245,158,11,0.4)', pointerEvents:'none' }} />

          {/* YOU */}
          <div style={{ position:'absolute', top:'50%', left:'50%', zIndex:20 }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', width:44, height:44, borderRadius:'50%', background:'rgba(245,158,11,0.25)', animation:'youPing 2s ease-out infinite' }} />
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:44, height:44, background:'linear-gradient(135deg,#fef08a,#f59e0b)', borderRadius:'50%', border:'3px solid #fff', boxShadow:'0 4px 14px rgba(245,158,11,0.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#78350f', fontSize:10, fontWeight:900, zIndex:1 }}>YOU</div>
          </div>

          {/* Neighbors */}
          {neighbors.map(n=>{
            const c = markerColor(n);
            const sel = selected?.id===n.id;
            return (
              <div key={n.id} className="marker" onClick={()=>setSelected(sel?null:n)}
                style={{ position:'absolute', top:n.top, left:n.left, transform:'translate(-50%,-50%)', cursor:'pointer', zIndex:10 }}>
                {sel && <div style={{ position:'absolute', top:'50%', left:'50%', width:40, height:40, borderRadius:'50%', background:`${c.border}30`, animation:'ping 1.5s ease-out infinite' }} />}
                <div style={{ width:40, height:40, borderRadius:'50%', background:c.bg, border:`2.5px solid ${c.border}`, boxShadow:`0 4px 12px ${c.border}44`, display:'flex', alignItems:'center', justifyContent:'center', color:c.text, fontSize:13, fontWeight:900, position:'relative', zIndex:1 }}>
                  {n.init}
                </div>
              </div>
            );
          })}

          {/* Popup */}
          {selected && (
            <div style={{ position:'absolute', bottom:16, left:16, right:16, background:'#fffdf5', borderRadius:20, boxShadow:'0 16px 48px rgba(180,130,0,0.18)', padding:'18px 20px', zIndex:30, border:'1.5px solid #fde68a', animation:'popIn 0.25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#fef08a,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', color:'#78350f', fontWeight:900, fontSize:17 }}>{selected.init}</div>
                  <div>
                    <h3 style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:'#451a03' }}>{selected.name}</h3>
                    <p style={{ margin:0, fontSize:12, color:'#a16207' }}>🏠 {selected.house}</p>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:99, width:32, height:32, cursor:'pointer', fontSize:15, color:'#92400e', fontFamily:'inherit' }}>×</button>
              </div>
              {selected.status==='selling' ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:16 }}>
                    {[['₹'+selected.price+'/kWh','Price'],[selected.units+' kWh','Available'],['● Selling','Status']].map(([v,l])=>(
                      <div key={l}>
                        <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:800, color:l==='Status'?'#15803d':'#451a03' }}>{v}</p>
                        <p style={{ margin:0, fontSize:11, color:'#a16207' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleConnect} style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:11, padding:'10px 20px', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(217,119,6,0.3)' }}>Connect ⚡</button>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'blink 1.5s infinite' }} />
                    <span style={{ color:'#b91c1c', fontWeight:700, fontSize:13 }}>Needs Energy</span>
                  </div>
                  <button onClick={handleConnect} style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:11, padding:'10px 20px', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Offer Energy ⚡</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[['⚡','4','Sellers Nearby','#b45309','#fff7ed','#fed7aa'],['📍','1.1 km','Max Distance','#0369a1','#f0f9ff','#bae6fd'],['🔋','18 kWh','Total Available','#15803d','#f0fdf4','#bbf7d0']].map(([ic,v,l,c,bg,br])=>(
            <div key={l} style={{ background:bg, border:`1.5px solid ${br}`, borderRadius:18, padding:'18px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{ic}</div>
              <div style={{ fontSize:22, fontWeight:900, color:c, letterSpacing:-0.5 }}>{v}</div>
              <div style={{ fontSize:11, color:c, marginTop:3, fontWeight:500, opacity:0.7 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}