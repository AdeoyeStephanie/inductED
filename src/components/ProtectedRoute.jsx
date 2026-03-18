/**
 * ProtectedRoute: Wraps a page so only logged-in users (and optionally only certain roles) can see it.
 * If not logged in, redirects to /login. If role required (e.g. "officer") and user doesn't have it, redirects to /dashboard.
 * Uses AuthContext for current user and profile.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children - The page content to show when allowed
 * @param {string} [props.requireRole] - Optional: "officer" | "prospective" | "inducted". If set, only users with this status can access.
 */
function ProtectedRoute({ children, requireRole = null }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Still loading auth/profile
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in → send to login, and remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role required and they don't have it → send to dashboard
  if (requireRole && profile && profile.status !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allowed: show the page and pass user + profile to children via context or they can get from hooks
  return children;
}

export default ProtectedRoute;
