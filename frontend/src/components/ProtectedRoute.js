import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const isTenDigitMobile = (value) => /^\d{10}$/.test(String(value || ''));
const hasValidLocation = (location) => {
  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const isProfileComplete = (user) => {
  if (!user) return false;
  const hasAddress = Boolean(String(user.address || '').trim()) && String(user.address || '').trim().toLowerCase() !== 'campus';
  return isTenDigitMobile(user.mobile) && hasAddress && hasValidLocation(user.location);
};

export default function ProtectedRoute({ children, requireCompleteProfile = true }) {
  const userStr = localStorage.getItem('user');
  const token   = localStorage.getItem('token');
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [completeProfile, setCompleteProfile] = useState(false);

  let parsedUser = null;
  try {
    parsedUser = userStr ? JSON.parse(userStr) : null;
  } catch {
    parsedUser = null;
  }

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!token || !parsedUser) {
        if (!mounted) return;
        setIsAuthenticated(false);
        setChecking(false);
        return;
      }

      try {
        const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
        const res = await axios.get(`${apiBase}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const serverUser = res?.data?.user;
        if (!mounted) return;

        if (res?.data?.success && serverUser) {
          const merged = { ...parsedUser, ...serverUser };
          localStorage.setItem('user', JSON.stringify(merged));
          setIsAuthenticated(true);
          setCompleteProfile(isProfileComplete(merged));
        } else {
          setIsAuthenticated(true);
          setCompleteProfile(isProfileComplete(parsedUser));
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(true);
        setCompleteProfile(isProfileComplete(parsedUser));
      } finally {
        if (mounted) setChecking(false);
      }
    };

    verify();
    return () => { mounted = false; };
  }, [token]);

  if (!token || !userStr) {
    return <Navigate to="/" replace />;
  }

  if (!parsedUser) {
    return <Navigate to="/" replace />;
  }

  if (checking) return null;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (requireCompleteProfile && !completeProfile) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

