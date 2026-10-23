import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// UI guard only. The server enforces the real permission check on every API call.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-screen"><span className="spinner dark" /> Checking session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
