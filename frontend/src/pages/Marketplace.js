import { useState, useEffect } from 'react';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .um-card { transition:transform 0.2s ease,box-shadow 0.2s ease; }
  .um-card:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(180,130,0,0.13) !important; }
  .pill:hover { opacity:0.8; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
`;

export default function Marketplace() {
  const [filter, setFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listingForm, setListingForm] = useState({ units:'', pricePerUnit:'', address:'' });
  const [done, setDone] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.getListings();
      if (res.success) setListings(res.listings);
      else setError(res.message || 'Failed to fetch listings');
    } catch { setError('Error fetching listings'); }
    finally { setLoading(false); }
  };

  const handleCreateListing = async () => {
    try {
      if (!listingForm.units || !listingForm.pricePerUnit || !listingForm.address) { setError('Please fill all fields'); return; }
      const res = await api.createListing({ units:parseFloat(listingForm.units), pricePerUnit:parseFloat(listingForm.pricePerUnit), location:{ address:listingForm.address } });
      if (res.success) { setShowListModal(false); setListingForm({units:'',pricePerUnit:'',address:''}); setDone(true); setTimeout(()=>setDone(false),3000); fetchListings(); }
      else setError(res.message);
    } catch { setError('Error creating listing'); }
  };

  const handlePurchase = async (listingId) => {
    try {
      const unitsStr = prompt('How many kWh do you want to purchase?');
      if (!unitsStr) return;
      const res = await api.purchaseEnergy(listingId, parseFloat(unitsStr));
      if (res.success) { setShowSuccess(true); setTimeout(()=>setShowSuccess(false),3000); fetchListings(); }
      else setError(res.message);
    } catch { setError('Error purchasing energy'); }
  };

  const filtered = listings
    .filter(l => filter==='available' ? l.available : true)
    .sort((a,b) => filter==='cheap' ? a.pricePerUnit-b.pricePerUnit : 0);

  const inp = { width:'100%', background:'#fff', border:'1.5px solid #fde68a', borderRadius:12, padding:'13px 16px', fontSize:14, color:'#451a03', outline:'none', fontFamily:"'DM Sans',sans-serif", transition:'border 0.2s', boxSizing:'border-box' };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#fffdf5', minHeight:'100vh' }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(160deg,#fffbe6 0%,#fef3c7 45%,#fde68a 100%)', padding:'36px 24px 28px', position:'relative', overflow:'hidden', borderBottom:'1px solid #fde68a' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(250,204,21,0.2) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:960, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p style={{ margin:'0 0 4px', fontSize:11, color:'#92740a', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Urjamitra</p>
            <h1 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, color:'#451a03', letterSpacing:-0.5, fontFamily:"'DM Sans',sans-serif" }}>⚡ Energy Marketplace</h1>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', animation:'blink 2.5s infinite' }} />
              <p style={{ margin:0, fontSize:12, color:'#15803d', fontWeight:700 }}>
                {filtered.filter(l=>l.available).length} listings available near you
              </p>
            </div>
          </div>
          <button onClick={()=>setShowListModal(true)} style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:14, padding:'12px 22px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(217,119,6,0.35)' }}>
            + List My Energy
          </button>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px' }}>

        {/* Toasts */}
        {done && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d', borderRadius:14, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:10, animation:'fadeUp 0.3s ease' }}>
            <span style={{ fontSize:18 }}>✅</span> <strong>Listing created!</strong> Neighbors can now see your energy.
          </div>
        )}
        {showSuccess && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d', borderRadius:14, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>⚡</span> <strong>Purchase successful!</strong> Energy is on its way.
          </div>
        )}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:14, padding:'12px 16px', marginBottom:16, fontSize:13 }}>❌ {error}</div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['all','All Listings'],['available','Available Now'],['cheap','Cheapest First']].map(([k,l])=>(
            <button key={k} className="pill" onClick={()=>setFilter(k)} style={{ padding:'9px 18px', borderRadius:99, border:'1.5px solid', borderColor:filter===k?'#d97706':'#fde68a', background:filter===k?'linear-gradient(135deg,#f59e0b,#d97706)':'#fff', color:filter===k?'#fff':'#a16207', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', boxShadow:filter===k?'0 2px 8px rgba(217,119,6,0.25)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:36, marginBottom:12, animation:'blink 1.5s infinite' }}>☀️</div>
            <p style={{ color:'#a16207', fontSize:14, fontWeight:500 }}>Loading energy listings…</p>
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', background:'#fff', borderRadius:22, border:'1.5px solid #fde68a' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p style={{ color:'#a16207', fontSize:14, fontWeight:500 }}>No listings yet. Be the first to share!</p>
            <button onClick={()=>setShowListModal(true)} style={{ marginTop:16, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              + List Energy
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((listing,idx)=>(
              <div key={listing._id} className="um-card" style={{ background:'#fff', border:`1.5px solid ${listing.available?'#fde68a':'#f3f4f6'}`, borderRadius:22, padding:'20px 24px', boxShadow:'0 4px 16px rgba(180,130,0,0.07)', opacity:listing.available?1:0.6, animation:`fadeUp 0.4s ease ${idx*0.05}s both` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#fef08a,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', color:'#92400e', fontWeight:900, fontSize:20, flexShrink:0, boxShadow:'0 2px 8px rgba(245,158,11,0.3)' }}>
                      {listing.seller?.name?.charAt(0)||'U'}
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#451a03' }}>{listing.seller?.name||'Unknown'}</h3>
                        <span style={{ fontSize:12, color:'#d97706', fontWeight:700 }}>★ {(listing.seller?.rating||5).toFixed(1)}</span>
                      </div>
                      <p style={{ margin:'0 0 2px', fontSize:12, color:'#a16207' }}>📍 {listing.location?.address||'Location TBD'}</p>
                      <p style={{ margin:0, fontSize:11, color:'#d1b87a' }}>Listed {new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:24, fontWeight:900, color:'#451a03', letterSpacing:-1, marginBottom:2 }}>
                      ₹{listing.pricePerUnit}<span style={{ fontSize:12, color:'#a16207', fontWeight:500 }}>/kWh</span>
                    </div>
                    <p style={{ margin:'0 0 10px', fontSize:12, color:'#a16207' }}>{listing.units} kWh available</p>
                    {listing.available ? (
                      <button onClick={()=>handlePurchase(listing._id)} style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:11, padding:'10px 20px', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(217,119,6,0.3)' }}>
                        Buy ⚡
                      </button>
                    ) : (
                      <span style={{ background:'#fef9c3', color:'#a16207', fontSize:11, fontWeight:600, padding:'6px 12px', borderRadius:99, border:'1px solid #fde68a' }}>Sold Out</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #fef9c3', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:16 }}>
                    <span style={{ fontSize:11, color:'#a16207' }}>💰 Total: ₹{(listing.units*listing.pricePerUnit).toFixed(0)}</span>
                    <span style={{ fontSize:11, color:'#a16207' }}>🌿 Saves {(listing.units*0.8).toFixed(1)} kg CO₂</span>
                  </div>
                  {listing.available && (
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', animation:'blink 2.5s infinite' }} />
                      <span style={{ fontSize:11, color:'#15803d', fontWeight:600 }}>Available Now</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIST MODAL */}
      {showListModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(120,80,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:50, backdropFilter:'blur(6px)' }}>
          <div style={{ background:'#fffdf5', borderRadius:'26px 26px 0 0', padding:'28px 28px 48px', width:'100%', maxWidth:520, boxShadow:'0 -16px 60px rgba(180,130,0,0.18)', animation:'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)', border:'1.5px solid #fde68a', borderBottom:'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#451a03' }}>⚡ List Your Energy</h2>
                <p style={{ margin:0, fontSize:12, color:'#a16207' }}>Neighbors nearby will see your listing</p>
              </div>
              <button onClick={()=>setShowListModal(false)} style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:99, width:36, height:36, cursor:'pointer', fontSize:16, color:'#92400e', fontFamily:'inherit' }}>✕</button>
            </div>
            {[['units','Units available (kWh)','e.g. 5','number'],['pricePerUnit','Price per kWh (₹)','e.g. 18','number'],['address','Your Address','e.g. House #7, Maple Lane','text']].map(([f,l,p,t])=>(
              <div key={f} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#a16207', display:'block', marginBottom:7, textTransform:'uppercase', letterSpacing:1 }}>{l}</label>
                <input type={t} placeholder={p} value={listingForm[f]} onChange={e=>setListingForm({...listingForm,[f]:e.target.value})} style={inp} onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#fde68a'} />
              </div>
            ))}
            {listingForm.units && listingForm.pricePerUnit && (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'13px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>You'll earn if fully sold</span>
                <span style={{ fontSize:20, fontWeight:900, color:'#15803d' }}>₹{(parseFloat(listingForm.units)*parseFloat(listingForm.pricePerUnit)||0).toFixed(0)}</span>
              </div>
            )}
            <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:11, padding:'10px 14px', marginBottom:20 }}>
              <p style={{ margin:0, fontSize:12, color:'#92400e' }}>💡 Avg price in your area: <strong>₹16–20/kWh</strong></p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={()=>setShowListModal(false)} style={{ padding:'15px', background:'#fef9c3', color:'#92400e', border:'1px solid #fde68a', borderRadius:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleCreateListing} style={{ padding:'15px', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', borderRadius:13, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(217,119,6,0.35)' }}>Post Listing ⚡</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}