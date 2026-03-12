import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#fffdf5",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        position: "relative"
      }}
    >
      <Sidebar isOpen={isSidebarOpen} close={() => setSidebarOpen(false)} />

      {/* Floating Chat Button */}
      <Link
        to="/chat"
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          background: "#2ecc71",
          color: "white",
          padding: "12px 18px",
          borderRadius: "30px",
          textDecoration: "none",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 9999,
          cursor: "pointer"
        }}
      >
        💬 Chat
      </Link>

      <div
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          position: "relative"
        }}
      >
        <div
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>

        {children}
      </div>
    </div>
  );
}