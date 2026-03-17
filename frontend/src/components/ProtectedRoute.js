import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const userStr = localStorage.getItem('user');
  const token   = localStorage.getItem('token');

  if (!token || !userStr) {
    return <Navigate to="/" replace />;
  }

  try {
    JSON.parse(userStr); // just validate it's parseable
    return children;
  } catch (err) {
    return <Navigate to="/" replace />;
  }
}

