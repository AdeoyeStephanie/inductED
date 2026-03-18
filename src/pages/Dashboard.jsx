/**
 * Dashboard: Personal dashboard. UI depends on user status.
 * - Prospective: running total, induction progress, link to submit
 * - Inducted: read-only point history + inducted badge
 * - Officer: message that they can't submit, link to officer dashboard
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserClaims } from '../firebase/firestoreHelpers';

// Points needed to be inducted (you can change this constant)
const POINTS_NEEDED_FOR_INDUCTION = 5;

function Dashboard() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    async function load() {
      setClaimsLoading(true);
      try {
        const list = await getUserClaims(user.uid);
        if (!cancelled) setClaims(list);
      } catch (err) {
        console.error('Failed to load user claims:', err);
        if (!cancelled) setClaims([]);
      } finally {
        if (!cancelled) setClaimsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const status = profile?.status || 'prospective';
  const justSignedUp = location.state?.justSignedUp;
  const totalPoints = profile?.totalPoints ?? 0;
  const pendingOrInReviewCount = claims.filter(
    (c) => c.status === 'pending' || c.status === 'in_review',
  ).length;

  return (
    <div className="page dashboard-page">
      <div className="dashboard-heading-row">
        <h1>Dashboard</h1>
        <Link to="/notifications" className="notification-link-wrap">
          Notifications
          {!claimsLoading &&
            (status === 'prospective' || status === 'inducted') &&
            pendingOrInReviewCount > 0 && (
              <span className="notification-badge">{pendingOrInReviewCount}</span>
            )}
        </Link>
      </div>
      <p className="welcome">Welcome, {profile?.name || user?.email}!</p>

      {justSignedUp && (
        <div className="card">
          <h2>Welcome to WICS!</h2>
          <p>
            You have just signed up and are currently registered as a{' '}
            <strong>{status === 'officer' ? 'WICS E-board (Officer)' : status === 'inducted' ? 'Inducted Member' : 'Prospective Member'}</strong>.
          </p>
          <p className="muted">
            Prospective members work toward induction by submitting point claims. Inducted members have
            completed the point requirement. WICS E-board members review and approve or reject claims.
          </p>
        </div>
      )}

      {/* Status-specific content */}
      {status === 'prospective' && (
        <>
          <div className="card points-card">
            <h2>Your Points</h2>
            <p className="points-total">{totalPoints} points</p>
            <p className="induction-progress">
              Progress to induction: {totalPoints} / {POINTS_NEEDED_FOR_INDUCTION} points
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (totalPoints / POINTS_NEEDED_FOR_INDUCTION) * 100)}%` }}
              />
            </div>
            <Link to="/submit" className="btn btn-primary">Submit a point claim</Link>
          </div>
        </>
      )}

      {status === 'inducted' && (
        <div className="card inducted-badge-card">
          <span className="badge badge-inducted large">Inducted Member</span>
          <p>You're currently an inducted member.</p>
          <p className="points-total">{totalPoints} total points</p>
          <p className="muted">
            <Link to="/notifications" className="link-button">View your claim notifications</Link>
          </p>
        </div>
      )}

      {status === 'officer' && (
        <div className="card officer-card">
          <p>As an officer, you cannot submit points for yourself.</p>
          <p>Use the Officer Dashboard to approve or reject pending point claims.</p>
          <Link to="/officer" className="btn btn-primary">Go to Officer Dashboard</Link>
        </div>
      )}

      {(status === 'prospective' || status === 'inducted') && (
        <p className="muted">
          <Link to="/notifications" className="link-button">View notification status for your point claims</Link>
        </p>
      )}
    </div>
  );
}

export default Dashboard;
