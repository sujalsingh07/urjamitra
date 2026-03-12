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
  input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #fffdf5 inset !important; -webkit-text-fill-color:#451a03 !important; }
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

  const inp = { width: '100%', background: '#fff', border: '1.5px solid #fde68a', borderRadius: 12, padding: '13px 16px', fontSize: 14, color: '#451a03', outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border 0.2s', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#fffbe6 0%,#fef3c7 45%,#fde68a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Segoe UI',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* bg blobs */}
      <div style={{ position: 'absolute', top: '-15%', left: '-8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(250,204,21,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-8%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(134,188,114,0.14) 0%,transparent 70%)', pointerEvents: 'none' }} />

      {particles.map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: p.w, height: p.h, top: p.top, left: p.left, right: p.right, borderRadius: '50%', background: p.bg, animation: p.anim, pointerEvents: 'none' }} />
      ))}

      {/* Card */}
      <div style={{ background: 'rgba(255,253,245,0.9)', backdropFilter: 'blur(16px)', border: '1.5px solid #fde68a', borderRadius: 28, padding: '44px 40px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(180,130,0,0.18), 0 0 0 1px rgba(245,158,11,0.08)', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <div style={{ position: 'absolute', inset: -14, border: '1.5px dashed rgba(245,158,11,0.35)', borderRadius: '50%', animation: 'sunSpin 22s linear infinite' }} />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#fef08a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'glow 3s ease-in-out infinite', position: 'relative', zIndex: 1 }}>☀️</div>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -0.5 }}>Urjamitra</h1>
          <p style={{ margin: '0 0 4px', color: '#d97706', fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>ऊर्जा मित्र</p>
          <p style={{ margin: 0, color: '#a16207', fontSize: 12 }}>Bijli baanto, dosti badhao</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#fef9c3', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid #fde68a' }}>
          {['Login', 'Sign Up'].map((label, i) => (
            <button key={label} onClick={() => { setIsLogin(i === 0); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, transition: 'all 0.2s', background: (i === 0) === isLogin ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'transparent', color: (i === 0) === isLogin ? '#fff' : '#a16207', boxShadow: (i === 0) === isLogin ? '0 2px 8px rgba(217,119,6,0.3)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>❌ {error}</div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isLogin && <input type="text" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#fde68a'} />}
          <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#fde68a'} />
          <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#fde68a'} />
          {!isLogin && <>
            <input type="text" placeholder="Home address (e.g. House #7, Maple Lane, Pune)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#fde68a'} />
            <p style={{ margin: 0, fontSize: 11, color: '#a16207' }}>📍 We use your address to connect you with nearby neighbors</p>
          </>}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: 20, padding: '16px', background: loading ? '#fef3c7' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: loading ? '#a16207' : '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 6px 20px rgba(217,119,6,0.35)' }}>
          {loading ? '⏳ Please wait...' : isLogin ? 'Login to Urjamitra ⚡' : 'Join Urjamitra 🌱'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#a16207', marginTop: 16, marginBottom: 0 }}>Your neighborhood energy community 🏘️</p>
      </div>
    </div>
  );
}