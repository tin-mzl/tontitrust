import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false, requiresKyc = false }) {
  const { user, isAdmin, isKycValidated } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (requiresKyc && !isKycValidated) return <Navigate to="/" replace />;
  return children;
}
