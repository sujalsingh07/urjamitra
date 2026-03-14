import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!token || !userStr) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // If user has not completed their profile, force them to profile page.
    const hasValidMobile = /^\d{10}$/.test(user.mobile || '');
    const isProfileIncomplete = !hasValidMobile || !user.address || user.address === 'Campus';

    // Get current pathname from window
    const isProfilePage = window.location.pathname === '/profile';

    if (isProfileIncomplete && !isProfilePage) {
      return <Navigate to="/profile" replace />;
    }

    return children;
  } catch (err) {
    // Parsing error or something else
    return <Navigate to="/" replace />;
  }
}
