/**
 * This page is for current e-board members to review and approve or reject pending point claims.
 * Officer dashboard: List of pending point claims with Approve / Reject actions.
 * Protected — officers only. Cannot submit points from here.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import {
  getAllClaimsForOfficer,
  approveClaim,
  rejectClaim,
  getUserById,
  markClaimInReview,
} from '../firebase/firestoreHelpers';

function Officer() {
  const { user, profile } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // claim id being acted on
  const [submitterNames, setSubmitterNames] = useState({});

  const loadClaims = async () => {
    setLoading(true);
    try {
      const list = await getAllClaimsForOfficer();
      setClaims(list);
      // Optionally load submitter names for display
      const names = {};
      await Promise.all(
        list.map(async (claim) => {
          const u = await getUserById(claim.userId);
          names[claim.userId] = u?.name || claim.userId;
        })
      );
      setSubmitterNames(names);
    } catch (err) {
      console.error(err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const formatDateTime = (date) => {
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

  const handleStartReview = async (claim) => {
    setActionLoading(claim.id);
    try {
      await markClaimInReview(claim.id);
      setClaims((prev) =>
        prev.map((c) => (c.id === claim.id ? { ...c, status: 'in_review' } : c)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (claim) => {
    setActionLoading(claim.id);
    try {
      const officerDisplayName = profile?.name || user?.email || 'Officer';
      await approveClaim(claim.id, user.uid, claim, officerDisplayName);
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claim.id
            ? {
                ...c,
                status: 'approved',
                reviewedAt: new Date(),
                reviewedBy: user.uid,
                reviewedByName: officerDisplayName,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (claim) => {
    setActionLoading(claim.id);
    try {
      await rejectClaim(claim.id, user.uid);
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claim.id
            ? { ...c, status: 'rejected', reviewedAt: new Date(), reviewedBy: user.uid }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const toReview = claims.filter((c) => c.status === 'pending');
  const inReview = claims.filter((c) => c.status === 'in_review');
  const approved = claims.filter((c) => c.status === 'approved');

  return (
    <div className="page officer-page">
      <h1>Officer Dashboard</h1>
      <p className="subtitle">Review and approve or reject pending point claims.</p>

      <div className="card officer-list-card">
        {loading ? (
          <p>Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="muted">No point claims have been submitted yet.</p>
        ) : (
          <div className="kanban-board">
            <div className="kanban-column">
              <h2 className="kanban-column-title">To review</h2>
              {toReview.length === 0 ? (
                <p className="muted small">No claims waiting for review.</p>
              ) : (
                toReview.map((claim) => (
                  <div key={claim.id} className="kanban-card">
                    <div className="kanban-card-main">
                      <div className="kanban-card-points">{claim.points} pts</div>
                      <div className="kanban-card-desc">{claim.description || '—'}</div>
                      <div className="kanban-card-meta">
                        <span>{submitterNames[claim.userId] || 'Unknown submitter'}</span>
                        <span>{formatDateTime(claim.createdAt)}</span>
                        <span className="kanban-status-badge">Pending</span>
                      </div>
                    </div>
                    <div className="kanban-card-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStartReview(claim)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === claim.id ? '...' : 'Move to In review'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(claim)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === claim.id ? '...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(claim)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === claim.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="kanban-column">
              <h2 className="kanban-column-title">In review</h2>
              {inReview.length === 0 ? (
                <p className="muted small">No claims currently in review.</p>
              ) : (
                inReview.map((claim) => (
                  <div key={claim.id} className="kanban-card">
                    <div className="kanban-card-main">
                      <div className="kanban-card-points">{claim.points} pts</div>
                      <div className="kanban-card-desc">{claim.description || '—'}</div>
                      <div className="kanban-card-meta">
                        <span>{submitterNames[claim.userId] || 'Unknown submitter'}</span>
                        <span>{formatDateTime(claim.createdAt)}</span>
                        <span className="kanban-status-badge">In review</span>
                      </div>
                    </div>
                    <div className="kanban-card-actions">
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(claim)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === claim.id ? '...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(claim)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === claim.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="kanban-column">
              <h2 className="kanban-column-title">Approved</h2>
              {approved.length === 0 ? (
                <p className="muted small">No approved claims yet.</p>
              ) : (
                approved.map((claim) => (
                  <div key={claim.id} className="kanban-card">
                    <div className="kanban-card-main">
                      <div className="kanban-card-points">{claim.points} pts</div>
                      <div className="kanban-card-desc">{claim.description || '—'}</div>
                      <div className="kanban-card-meta">
                        <span>{submitterNames[claim.userId] || 'Unknown submitter'}</span>
                        <span>{formatDateTime(claim.createdAt)}</span>
                        <span>
                          Approved by {claim.reviewedByName || 'Officer'}
                        </span>
                        <span className="kanban-status-badge kanban-status-approved">
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Officer;
