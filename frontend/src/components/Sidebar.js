import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, close }) {
    const navigate = useNavigate();
    const location = useLocation();
    const links = [
        { path: '/dashboard', label: 'Dashboard', icon: '⚡' },
        { path: '/marketplace', label: 'Marketplace', icon: '🏪' },
        { path: '/map', label: 'Energy Map', icon: '📍' },
        { path: '/transactions', label: 'Transactions', icon: '📊' },
        { path: '/messages', label: 'Messages', icon: '💬' },
    ];

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <>
            <style>{`
        /* Sidebar Styles */
        .um-sidebar { width: 280px; background: #fffdf5; border-right: 1.5px solid #fde68a; height: 100vh; display: flex; flex-direction: column; padding: 32px 0 24px; z-index: 40; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); flex-shrink: 0; }
        .sidebar-link { display: flex; align-items: center; gap: 14px; padding: 14px 28px; color: #92400e; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.2s; border-right: 4px solid transparent; cursor: pointer; margin-bottom: 4px; }
        .sidebar-link:hover { background: rgba(245,158,11,0.08); color: #b45309; }
        .sidebar-link.active { background: linear-gradient(90deg, rgba(253,230,138,0.3), rgba(253,230,138,0.1)); border-right-color: #f59e0b; color: #d97706; }
        .sidebar-logo { display:flex; align-items:center; gap:12px; padding:0 28px; margin-bottom: 24px; }
        .sidebar-profile { display:flex; flex-direction:column; align-items:center; padding: 16px 28px; margin-bottom: 32px; cursor: pointer; transition: transform 0.2s; }
        .sidebar-profile:hover { transform: translateY(-2px); }
        .profile-circle { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #fde68a, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.2); border: 2px solid #fff; margin-bottom: 12px; }
        
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
      `}</style>

            {isOpen && <div className="um-sidebar-overlay" onClick={close} />}
            <div className={`um-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(234,88,12,0.3)' }}>☀️</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#451a03', letterSpacing: -0.5 }}>Urjamitra</h2>
                        <p style={{ margin: 0, fontSize: 12, color: '#b45309', fontWeight: 600 }}>Energy Network</p>
                    </div>
                </div>

                {user && (
                    <div className="sidebar-profile" onClick={() => { navigate('/profile'); close(); }}>
                        <div className="profile-circle">{initial}</div>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#451a03' }}>{user.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', marginTop: 4 }}>View Profile</span>
                    </div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {links.map(l => {
                        const active = location.pathname === l.path;
                        return (
                            <div key={l.path} className={`sidebar-link ${active ? 'active' : ''}`} onClick={() => { navigate(l.path); close(); }}>
                                <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(100%) opacity(0.6)', transform: active ? 'scale(1.1)' : 'none', transition: 'transform 0.2s' }}>{l.icon}</span>
                                {l.label}
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: 24, paddingBottom: 0 }}>
                    <button
                        onClick={() => { localStorage.removeItem('user'); navigate('/'); close(); }}
                        style={{ width: '100%', background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                    >
                        <span style={{ fontSize: 18 }}>🚪</span> Logout
                    </button>
                </div>
            </div>
        </>
    );
}
