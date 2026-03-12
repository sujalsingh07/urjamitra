import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  
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
  .gradient-btn { background: linear-gradient(135deg, #f59e0b, #ea580c); color: #fff; border: none; border-radius: 12px; padding: 10px 18px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; gap: 8px; }
  .gradient-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 24px rgba(234, 88, 12, 0.35); }
  .ghost-btn { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); color: #9A3412; border: 1.5px solid rgba(253,230,138,0.8); border-radius: 12px; padding: 10px 18px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center; gap: 8px; }
  .ghost-btn:hover { background: #fff; border-color: #f59e0b; transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 24px rgba(253, 230, 138, 0.4); }
  
  .leaflet-popup-content-wrapper { border-radius: 16px; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); box-shadow: 0 16px 32px rgba(180,130,0,0.15); border: 1px solid rgba(253,230,138,0.5); }
  .leaflet-popup-tip { background: rgba(255,255,255,0.95); border-left: 1px solid rgba(253,230,138,0.5); border-top: 1px solid rgba(253,230,138,0.5); }
  
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
`;

const sellerIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
});

const buyerIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const youIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [36, 36],
});

const neighbors = [
  { id: 1, name: "Sunita Sharma", house: "House #7", units: 5, price: 18, type: "seller", position: [18.5208, 73.857] },
  { id: 2, name: "Anil Mehta", house: "Flat 4B", units: 3, price: 16, type: "seller", position: [18.5212, 73.858] },
  { id: 3, name: "Priya Patel", house: "House #12", units: 8, price: 20, type: "seller", position: [18.5197, 73.8559] },
  { id: 4, name: "Rajesh Kumar", house: "Flat 2A", units: 0, price: 0, type: "buyer", position: [18.5201, 73.8548] },
];

function MapView() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleConnect = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const yourLocation = [18.5204, 73.8567];

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        padding: '32px 24px 64px',
        background: 'radial-gradient(ellipse at top right, rgba(253,230,138,0.3), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.3), transparent 70%), #fefaf0',
        backgroundSize: '200% 200%',
        minHeight: '100vh',
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(12px)', transition: 'all 0.6s ease' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#92740a', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Live Network</p>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>🗺️ Neighborhood Map</h1>
            </div>
            {showSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, animation: 'fadeUp 0.3s ease' }}>
                ⚡ Connection request sent!
              </div>
            )}
          </div>

          <div className="um-card" style={{ borderRadius: 24, overflow: 'hidden', padding: 8, boxShadow: '0 16px 40px rgba(180,130,0,0.12)', marginBottom: 24 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(253,230,138,0.5)' }}>
              <MapContainer center={yourLocation} zoom={15} style={{ height: "500px", width: "100%", zIndex: 1 }}>
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <Marker position={yourLocation} icon={youIcon}>
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '4px' }}>
                      <strong style={{ fontSize: 16, color: '#1e3a8a', fontFamily: "'DM Sans', sans-serif" }}>You</strong>
                      <p style={{ margin: '4px 0 0', color: '#3b82f6', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Your Solar System</p>
                    </div>
                  </Popup>
                </Marker>

                <Circle center={yourLocation} radius={600} pathOptions={{ color: "#3b82f6", fillOpacity: 0.1, weight: 1, dashArray: '4,4' }} />

                {neighbors.map((n) => (
                  <Marker key={n.id} position={n.position} icon={n.type === "seller" ? sellerIcon : buyerIcon}>
                    <Popup>
                      <div style={{ padding: '4px 2px', minWidth: 160, fontFamily: "'DM Sans', sans-serif" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: n.type === 'seller' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            {n.type === "seller" ? "↑" : "↓"}
                          </div>
                          <div>
                            <strong style={{ fontSize: 15, color: '#451a03', display: 'block', lineHeight: 1.2 }}>{n.name}</strong>
                            <span style={{ fontSize: 11, color: '#92740a' }}>{n.house}</span>
                          </div>
                        </div>

                        <div style={{ background: '#fef9c3', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                          {n.type === "seller" ? (
                            <>
                              <div style={{ fontSize: 13, color: '#78350f', fontWeight: 600 }}>Selling {n.units} kWh</div>
                              <div style={{ fontSize: 16, color: '#15803d', fontWeight: 900 }}>₹{n.price}/kWh</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>Needs Energy</div>
                          )}
                        </div>

                        <button onClick={handleConnect} className={n.type === "seller" ? "gradient-btn" : "ghost-btn"} style={{ width: '100%', padding: '12px' }}>
                          {n.type === "seller" ? "Connect" : "Offer Energy"} ⚡
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="stats-grid">
            {[
              { val: '3', label: 'Sellers Nearby', color: '#15803d', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#86efac' },
              { val: '600 m', label: 'Trading Radius', color: '#0369a1', bg: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '#7dd3fc' },
              { val: '16 kWh', label: 'Available Energy', color: '#b45309', bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fdba74' },
            ].map((s, i) => (
              <div key={s.label} className="um-card" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '20px', textAlign: 'center', animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s both` }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#78350f', marginTop: 4, fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

export default MapView;