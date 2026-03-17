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
  @keyframes scale-bounce { 0%{transform:scale(0) rotate(-45deg); opacity:0} 50%{transform:scale(1.1)} 100%{transform:scale(1); opacity:1} }
  @keyframes dot-fade { 0%,100%{opacity:0.3} 50%{opacity:1} }
  
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

  @keyframes demoPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
  .demo-btn {
    width: 100%;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #22c55e;
    border: 1.5px solid rgba(34,197,94,0.4);
    border-radius: 16px;
    padding: 14px;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: -0.2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    font-family: inherit;
  }
  .demo-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-color: #22c55e;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(34,197,94,0.2);
    animation: demoPulse 2s ease-in-out infinite;
  }
  .demo-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .demo-panel {
    background: #0f172a;
    border: 1px solid rgba(34,197,94,0.25);
    border-radius: 20px;
    padding: 24px;
    margin-top: 16px;
  }
  .demo-user-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }
  .demo-user-card:hover { border-color: rgba(34,197,94,0.4); }
  .demo-login-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    margin-top: 10px;
    font-family: inherit;
    transition: all 0.2s;
  }
  .demo-login-btn.seller { background: #22c55e; color: #000; }
  .demo-login-btn.seller:hover { background: #16a34a; }
  .demo-login-btn.buyer  { background: #3b82f6; color: #fff; }
  .demo-login-btn.buyer:hover  { background: #2563eb; }
`;

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  // ── Signup state ────────────────────────────────────────────────────────────
  // step: 'email' | 'otp' | 'details' | 'done'
  const [step, setStep] = useState('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupPassConfirm, setSignupPassConfirm] = useState('');

  const resetSignup = () => {
    setStep('email'); setSignupEmail(''); setOtpCode('');
    setEmailSent(false);
    setSignupName(''); setSignupPass(''); setSignupPassConfirm('');
    setError('');
  };

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  // Step 1 → send OTP
  const handleSendOTP = async () => {
    const email = signupEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.'); return;
    }
    setError(''); setLoading(true);
    try {
      const api = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const res = await axios.post(`${api}/auth/request-otp`, { email });
      if (res.data.success) {
        setEmailSent(res.data.emailDelivered !== false);
        setStep('otp');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Is the backend running?');
    } finally { setLoading(false); }
  };

  // Step 2 → verify OTP
  const handleVerifyOTP = async () => {
    const code = otpCode.replace(/\D/g, '');
    if (code.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setError(''); setLoading(true);
    try {
      const api = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const res = await axios.post(`${api}/auth/verify-otp`, { email: signupEmail.trim().toLowerCase(), otp: code });
      if (res.data.success) { setStep('details'); }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  // Step 3 → complete signup
  const handleCompleteSignup = async () => {
    if (!signupName.trim()) { setError('Enter your name.'); return; }
    if (signupPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (signupPass !== signupPassConfirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const api = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const res = await axios.post(`${api}/auth/signup-with-otp`, {
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPass,
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (window.__socket) window.__socket.emit('register', res.data.user._id);
        setStep('done');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const endpoint = isLogin ? `${apiBase}/auth/login` : `${apiBase}/auth/signup`;
      const res = await axios.post(endpoint, form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        // Register socket room so live telemetry & IES events start flowing
        if (window.__socket) {
          window.__socket.emit('register', res.data.user._id);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Demo Mode ─────────────────────────────────────────────────────────────
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoReady, setDemoReady]     = useState(false);
  const [demoUsers, setDemoUsers]     = useState(null);
  const [showDemo, setShowDemo]       = useState(false);

  const seedDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const res = await axios.post(`${apiBase}/auth/demo-seed`);
      if (res.data.success) {
        setDemoUsers(res.data.users);
        setDemoReady(true);
      } else {
        setError(res.data.message || 'Demo seed failed');
      }
    } catch (err) {
      setError('❌ Backend not running. Open a terminal → cd backend → node server.js');
    } finally { setDemoLoading(false); }
  };

  const loginAs = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    if (window.__socket) {
      window.__socket.emit('register', userData.user._id);
      if (userData.role === 'seller') {
        window.__socket.emit('meter:setProsumer', {
          userId: userData.user._id,
          generationKw: 8,
          consumptionKw: 3,
        });
      }
    }
    navigate('/dashboard');
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
            <button key={label} onClick={() => { setIsLogin(i === 0); setError(''); if (i === 1) resetSignup(); }}
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

        {/* ── LOGIN FORM ─────────────────────────────────────────────────── */}
        {isLogin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="premium-input" />
            <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="premium-input" />
            <button onClick={handleSubmit} disabled={loading} className="gradient-btn" style={{ width: '100%', marginTop: 24 }}>
              {loading ? '⏳ Please wait...' : 'Login to Urjamitra ⚡'}
            </button>
          </div>

        ) : step === 'email' ? (
          /* ── SIGNUP STEP 1: Email ──────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              Enter your email — we'll send you a one-time code to verify it.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={signupEmail}
              onChange={e => { setSignupEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              className="premium-input"
              autoFocus
            />
            <button onClick={handleSendOTP} disabled={loading} className="gradient-btn" style={{ width: '100%', marginTop: 16 }}>
              {loading ? '⏳ Sending…' : 'Send OTP 📧'}
            </button>
          </div>

        ) : step === 'otp' ? (
          /* ── SIGNUP STEP 2: OTP ─────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* info banner */}
            <div style={{ background: emailSent ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.12)', border: `1px solid ${emailSent ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}`, padding: '12px 16px', borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                {emailSent ? `✅ Code sent to ${signupEmail}` : `⚠️ Email delivery failed. Please tap Resend OTP.`}
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              maxLength="6"
              className="premium-input"
              style={{ fontSize: 28, letterSpacing: '10px', textAlign: 'center', fontWeight: 700 }}
              autoFocus
            />

            <button onClick={handleVerifyOTP} disabled={loading || otpCode.length !== 6} className="gradient-btn" style={{ width: '100%', marginTop: 8 }}>
              {loading ? '⏳ Verifying…' : 'Verify Code ✓'}
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={resetSignup} disabled={loading} style={{ flex: 1, background: 'transparent', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={handleSendOTP} disabled={loading} style={{ flex: 1, background: 'transparent', color: '#a16207', border: '1px solid #fde68a', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Resend OTP ↺
              </button>
            </div>
          </div>

        ) : step === 'details' ? (
          /* ── SIGNUP STEP 3: Name + Password ─────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', padding: '10px 14px', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#166534', fontWeight: 600 }}>✅ Email verified: {signupEmail}</p>
            </div>
            <input
              type="text"
              placeholder="Full name"
              value={signupName}
              onChange={e => { setSignupName(e.target.value); setError(''); }}
              className="premium-input"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={signupPass}
              onChange={e => { setSignupPass(e.target.value); setError(''); }}
              className="premium-input"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={signupPassConfirm}
              onChange={e => { setSignupPassConfirm(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCompleteSignup()}
              className="premium-input"
            />
            <button onClick={handleCompleteSignup} disabled={loading} className="gradient-btn" style={{ width: '100%', marginTop: 8 }}>
              {loading ? '⏳ Creating account…' : 'Join Urjamitra 🌱'}
            </button>
            <button onClick={() => { setStep('otp'); setError(''); }} disabled={loading} style={{ background: 'transparent', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
          </div>

        ) : step === 'done' ? (
          /* ── SIGNUP SUCCESS ───────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, minHeight: 280, justifyContent: 'center' }}>
            <div style={{ fontSize: 64, animation: 'scale-bounce 0.6s ease-in-out' }}>✨</div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif" }}>Welcome to Urjamitra!</h2>
            <p style={{ margin: 0, fontSize: 15, color: '#92400e', fontWeight: 600 }}>You're now part of our energy community 🌱</p>
            <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#a16207', marginTop: 8 }}>
              <span>Redirecting to dashboard</span>
              <span style={{ animation: 'dot-fade 1.5s infinite' }}>.</span>
              <span style={{ animation: 'dot-fade 1.5s infinite', animationDelay: '0.3s' }}>.</span>
              <span style={{ animation: 'dot-fade 1.5s infinite', animationDelay: '0.6s' }}>.</span>
            </div>
          </div>
        ) : null}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#a16207', marginTop: 20, marginBottom: 0, fontWeight: 600 }}>Your neighborhood energy community 🏘️</p>

        {/* ── Demo Mode Panel ── */}
        <div style={{ marginTop: 24, borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 20 }}>
          <button
            className="demo-btn"
            onClick={() => { setShowDemo(d => !d); if (!demoReady && !showDemo) seedDemo(); }}
            disabled={demoLoading}
          >
            {demoLoading
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'sunSpin 0.8s linear infinite' }} /> Seeding demo accounts...</>
              : demoReady
                ? (showDemo ? '▲ Hide Demo Panel' : '🎬 Show Demo Login')
                : '🎬 Launch Demo Mode'
            }
          </button>

          {showDemo && demoReady && demoUsers && (
            <div className="demo-panel">
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e', marginBottom: 16, letterSpacing: 0.5 }}>
                ✅ DEMO ACCOUNTS READY · METERS SEEDED AT 8 kW SOLAR
              </div>

              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
                Open this page in <strong style={{ color: '#94a3b8' }}>two browser tabs</strong>.<br />
                Log in as Arun in Tab 1, Lakshmi in Tab 2.
              </div>

              {demoUsers.map((u) => (
                <div key={u.email} className="demo-user-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {u.role === 'seller' ? '☀️ Prosumer · Seller' : '🏠 Consumer · Buyer'}
                      </div>
                    </div>
                    <div style={{
                      background: u.role === 'seller' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${u.role === 'seller' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700,
                      color: u.role === 'seller' ? '#22c55e' : '#3b82f6'
                    }}>
                      ₹{u.wallet}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, marginBottom: 6 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ color: '#475569' }}>Email</div>
                      <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{u.email}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ color: '#475569' }}>Password</div>
                      <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{u.password}</div>
                    </div>
                  </div>

                  {u.role === 'seller' && (
                    <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#ca8a04', marginBottom: 6 }}>
                      ⚡ Meter seeded: 8 kW generation · 5 kWh listing @ ₹5/kWh · DISCOM logs pre-loaded
                    </div>
                  )}

                  <button
                    className={`demo-login-btn ${u.role}`}
                    onClick={() => loginAs(u)}
                  >
                    {u.role === 'seller'
                      ? `☀️ Login as ${u.name} (Seller) — Tab 1`
                      : `🏠 Login as ${u.name} (Buyer) — Tab 2`}
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 11, color: '#64748b', lineHeight: 2 }}>
                <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>📋 After logging in:</div>
                <div>1. <strong style={{ color: '#f1f5f9' }}>Arun (Tab 1)</strong> → Dashboard shows 8 kW solar live</div>
                <div>2. <strong style={{ color: '#f1f5f9' }}>Lakshmi (Tab 2)</strong> → Sidebar → 🔗 P2P Trade</div>
                <div>3. Select Arun's listing → Enter 5 units → Initiate Trade</div>
                <div>4. <strong style={{ color: '#f1f5f9' }}>Arun (Tab 1)</strong> → P2P Trade page → Approve consent</div>
                <div>5. Watch IES console → DISCOM verify → Settlement! 🎉</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}