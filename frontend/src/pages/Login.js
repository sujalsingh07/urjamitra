import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.08)} }
  @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(180deg)} }
  @keyframes sunSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 24px rgba(245,158,11,0.35)} 50%{box-shadow:0 0 48px rgba(245,158,11,0.6)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shine { 100% { left: 150%; } }
  
  input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #fff inset !important; -webkit-text-fill-color:#451a03 !important; }
  
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
    border-radius: 16px; 
    padding: 18px; 
    font-weight: 800; 
    font-size: 15px; 
    letter-spacing: -0.2px; 
    cursor: pointer; 
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
    box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255,255,255,0.4); 
    display: flex; align-items: center; justify-content: center; gap: 10px; 
    position: relative; overflow: hidden; 
  }
  .gradient-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); transition: 0s; }
  .gradient-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.02); box-shadow: 0 16px 32px rgba(234, 88, 12, 0.35); }
  .gradient-btn:hover:not(:disabled)::after { animation: shine 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .gradient-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  .gradient-btn:disabled { background: #fef3c7; color: #d97706; cursor: not-allowed; box-shadow: none; }
`;

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const endpoint = isLogin ? 'http://localhost:5001/api/auth/login' : 'http://localhost:5001/api/auth/signup';
      const res = await axios.post(endpoint, form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const particles = [
    { w: 7, h: 7, top: '12%', left: '8%', bg: 'rgba(245,158,11,0.35)', anim: 'float1 6s ease-in-out infinite' },
    { w: 5, h: 5, top: '72%', left: '6%', bg: 'rgba(134,188,114,0.4)', anim: 'float2 8s ease-in-out infinite' },
    { w: 9, h: 9, top: '28%', right: '10%', bg: 'rgba(245,158,11,0.25)', anim: 'float1 7s ease-in-out infinite 1s' },
    { w: 4, h: 4, top: '78%', right: '8%', bg: 'rgba(134,188,114,0.35)', anim: 'float2 5s ease-in-out infinite 0.5s' },
    { w: 6, h: 6, top: '50%', left: '4%', bg: 'rgba(251,191,36,0.4)', anim: 'float1 9s ease-in-out infinite 2s' },
    { w: 11, h: 11, top: '8%', right: '22%', bg: 'rgba(134,188,114,0.2)', anim: 'float2 6s ease-in-out infinite 1.5s' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top right, rgba(253,230,138,0.4), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.4), transparent 70%), #fffdf5',
      backgroundSize: '200% 200%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Segoe UI',sans-serif", position: 'relative', overflow: 'hidden'
    }}>
      <style>{CSS}</style>

      {/* bg blobs */}
      <div style={{ position: 'absolute', top: '-15%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(250,204,21,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(134,188,114,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />

      {particles.map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: p.w, height: p.h, top: p.top, left: p.left, right: p.right, borderRadius: '50%', background: p.bg, animation: p.anim, pointerEvents: 'none' }} />
      ))}

      {/* Glassmorphism Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 32, padding: '48px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 64px rgba(180,130,0,0.12), 0 0 0 1px rgba(255,255,255,1)',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', zIndex: 1
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <div style={{ position: 'absolute', inset: -14, border: '1.5px dashed rgba(245,158,11,0.35)', borderRadius: '50%', animation: 'sunSpin 22s linear infinite' }} />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#fef08a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'glow 3s ease-in-out infinite', position: 'relative', zIndex: 1, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>☀️</div>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -0.5 }}>Urjamitra</h1>
          <p style={{ margin: '0 0 4px', color: '#ea580c', fontWeight: 800, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>ऊर्जा मित्र</p>
          <p style={{ margin: 0, color: '#a16207', fontSize: 13, fontWeight: 500 }}>Bijli baanto, dosti badhao</p>
        </div>

        {/* iOS Pill Toggle */}
        <div style={{ display: 'flex', background: 'rgba(253,230,138,0.3)', borderRadius: 14, padding: 6, marginBottom: 28, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
          {['Login', 'Sign Up'].map((label, i) => (
            <button key={label} onClick={() => { setIsLogin(i === 0); setError(''); }}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, letterSpacing: -0.2, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                background: (i === 0) === isLogin ? '#fff' : 'transparent',
                color: (i === 0) === isLogin ? '#b45309' : '#a16207',
                boxShadow: (i === 0) === isLogin ? '0 4px 12px rgba(180,130,0,0.1)' : 'none'
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13, padding: '12px 16px', borderRadius: 12, marginBottom: 20 }}>❌ {error}</div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && <input type="text" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="premium-input" />}
          <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="premium-input" />
          <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="premium-input" />
          {!isLogin && <>
            <input type="text" placeholder="Home address (e.g. House #7, Maple Lane)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="premium-input" />
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(253,230,138,0.2)', padding: '12px 16px', borderRadius: 12, marginTop: 4 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600, lineHeight: 1.4 }}>We use your address to connect you with nearby neighbors</p>
            </div>
          </>}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} className="gradient-btn" style={{ width: '100%', marginTop: 24 }}>
          {loading ? '⏳ Please wait...' : isLogin ? 'Login to Urjamitra ⚡' : 'Join Urjamitra 🌱'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#a16207', marginTop: 20, marginBottom: 0, fontWeight: 600 }}>Your neighborhood energy community 🏘️</p>
      </div>
    </div>
  );
}