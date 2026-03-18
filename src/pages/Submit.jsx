/**
 * Submit page: Form to submit a point claim. Protected — prospective members only.
 * Officers and inducted members are redirected to dashboard (handled by ProtectedRoute requireRole).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitPointClaim, uploadClaimImage } from '../firebase/firestoreHelpers';

const CLAIM_CATEGORIES = [
  { value: 'interest_meeting', label: 'Interest Meeting', points: 1 },
  { value: 'wics_event', label: 'Attend a WiCS event', points: 1 },
  { value: 'wics_service', label: 'Attend a WiCS community service', points: 1 },
  { value: 'photo_with_eboard', label: 'Take a picture with an E-board member', points: 1 },
  { value: 'hackathon', label: 'Attend a hackathon', points: 2 },
  { value: 'job_fair', label: 'Attend the job fair', points: 2 },
  {
    value: 'conference',
    label: 'Attend a conference (BEYA, NSBE, or other tech/professional conference)',
    points: 2,
  },
];

const MAX_PROOF_SIZE_BYTES = 3 * 1024 * 1024; // The image size limit is 3 MB

function Submit() {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!category) { // if the student tries to submit a claim without choosing a category, set the error
      setError('Please choose a category for your claim.');
      return;
    }
    if (!proofFile) {
      setError('Please upload a JPG proof your attendance before submitting your claim.');
      return;
    }

    const isJpg =
      proofFile.type === 'image/jpeg' ||
      proofFile.type === 'image/jpg' ||
      /\.jpe?g$/i.test(proofFile.name);
    if (!isJpg) {
      setError('Please upload a JPG image (.jpg or .jpeg).');
      return;
    }
    if (proofFile.size > MAX_PROOF_SIZE_BYTES) {
      setError('Image is too large. Please upload a JPG under 3MB.');
      return;
    }

    const selected = CLAIM_CATEGORIES.find((c) => c.value === category);
    if (!selected) {
      setError('Please choose a valid category.');
      return;
    }

    setLoading(true);
    try {
      const proofUrl = await uploadClaimImage(proofFile, user.uid);

      await submitPointClaim(
        user.uid,
        selected.points,
        extraInfo.trim(),
        selected.label,
        proofUrl,
      );
      setSuccess(true);
      setCategory('');
      setExtraInfo('');
      setProofFile(null);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page submit-page">
      <h1>Submit Point Claim</h1>
      <p className="subtitle">Request points for an activity. An officer will review your submission.</p>

      <div className="card submit-card">
        <form onSubmit={handleSubmit} className="submit-form">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Select a category</option>
              {CLAIM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.points} pt{c.points > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="proof">Upload proof (JPG, max 3MB)</label>
            <input
              id="proof"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="extraInfo">Extra information (optional)</label>
            <textarea
              id="extraInfo"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              placeholder="Add any details about the activity (e.g., event name, date, location)."
              rows={3}
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Claim submitted! Redirecting to dashboard...</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </div>

      <p className="muted">
        Your current total: <strong>{profile?.totalPoints ?? 0} points</strong>
      </p>
    </div>
  );
}

export default Submit;
