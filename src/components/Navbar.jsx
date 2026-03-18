/**
 * Navbar: Shows app title, and when logged in: user name, status badge, and logout button.
 * Uses AuthContext for current user and profile so we don't duplicate auth logic.
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../firebase/authHelpers';

function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // On login page, show minimal navbar (just title and link to app)
  if (isLoginPage) {
    return (
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          WICS Point Tracker
        </Link>
      </nav>
    );
  }

  // Not logged in and not on login page (e.g. redirected)
  if (!user) {
    return (
      <nav className="navbar">
        <Link to="/login" className="navbar-brand">
          WICS Point Tracker
        </Link>
      </nav>
    );
  }

  // Logged in: show name, badge, logout
  const statusLabel = profile?.status === 'officer' ? 'Officer' : profile?.status === 'inducted' ? 'Inducted' : 'Prospective';
  const badgeClass = `badge badge-${profile?.status || 'prospective'}`;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        WICS Point Tracker
      </Link>
      <div className="navbar-right">
        <span className="navbar-name">{profile?.name || user.email}</span>
        <span className={badgeClass}>{statusLabel}</span>
        <button type="button" className="btn btn-outline btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
