/**
 * Notifications: Users view the progress of their point claims (pending, in review, approved, rejected).
 * Officer identity is never shown — only status and outcome.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserClaims } from '../firebase/firestoreHelpers';

function Notifications() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const list = await getUserClaims(user.uid);
        if (!cancelled) setClaims(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) setClaims([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return String(date);
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending review', summary: 'Your claim is waiting to be reviewed.' };
      case 'in_review':
        return { label: 'In review', summary: 'Your claim is currently being reviewed.' };
      case 'approved':
        return { label: 'Approved', summary: 'Your point claim has been approved.' };
      case 'rejected':
        return { label: 'Rejected', summary: 'Your point claim was not approved.' };
      default:
        return { label: status || '—', summary: '' };
    }
  };

  return (
    <div className="page notifications-page">
      <div className="page-header-with-notifications">
        <h1>Notifications</h1>
        <Link to="/dashboard" className="link-button back-to-dashboard">
          ← Back to Dashboard
        </Link>
      </div>
      <p className="subtitle">
        Track the status of your point claims. You’ll see when a claim is approved or rejected.
      </p>

      <div className="card notifications-card">
        {loading ? (
          <p>Loading your claims...</p>
        ) : claims.length === 0 ? (
          <p className="muted">You have no point claims yet. Submit a claim from your dashboard.</p>
        ) : (
          <ul className="notifications-list">
            {claims.map((claim) => {
              const { label, summary } = getStatusMessage(claim.status);
              const displayTitle = claim.category || claim.description || 'Point claim';
              return (
                <li
                  key={claim.id}
                  className={`notification-item notification-${claim.status}`}
                >
                  <div className="notification-main">
                    <span className="notification-points">{claim.points} pts</span>
                    <span className="notification-title">{displayTitle}</span>
                    {claim.description && claim.category && (
                      <span className="notification-detail">{claim.description}</span>
                    )}
                    <span className="notification-date">{formatDate(claim.createdAt)}</span>
                  </div>
                  <div className="notification-status">
                    <span className={`notification-status-badge status-${claim.status}`}>
                      {label}
                    </span>
                    <p className="notification-summary">{summary}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Notifications;
