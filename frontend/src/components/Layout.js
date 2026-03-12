import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fffdf5', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
            <Sidebar isOpen={isSidebarOpen} close={() => setSidebarOpen(false)} />

            <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
                <div className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </div>

                {children}
            </div>
        </div>
    );
}
