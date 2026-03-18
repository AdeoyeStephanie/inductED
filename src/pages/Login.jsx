/**
 * Login page: Sign in and Sign up forms (email/password).
 * Open to everyone — no auth required. Redirects to dashboard (or previous page) after successful login.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signUp } from '../firebase/authHelpers';

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signupStatus, setSignupStatus] = useState('prospective'); //default status is prospective
  const [officerYear, setOfficerYear] = useState('2026'); //default year is 2026
  const [officerRole, setOfficerRole] = useState(''); //default role is empty
  const [error, setError] = useState(''); //default error is empty
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // If they were redirected here from a protected route, send them back after login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        if (signupStatus === 'officer') {
          const currentYear = new Date().getFullYear();
          const parsedYear = Number(officerYear);
          if (!officerYear || Number.isNaN(parsedYear)) {
            setError('Please select the academic year for your officer role.');
            setLoading(false);
            return;
          }
          if (parsedYear !== currentYear) {
            setError('You can only sign up as an officer for the current academic year.'); //if the year is not the current year, set the error
            setLoading(false);
            return;
          }
          if (!officerRole.trim()) {
            setError('Please enter your officer role (e.g., President, Treasurer).');
            setLoading(false);
            return;
          }
        }

        await signUp(email, password, name, signupStatus, signupStatus === 'officer'
          ? { year: officerYear, role: officerRole.trim() }
          : null);
      } else {
        await signIn(email, password);
      }
      navigate(from, { replace: true, state: { justSignedUp: isSignUp } });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card">
        <h1>WICS Point Tracker</h1>
        <p className="subtitle">Morgan State University — Women in Computer Science</p>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                disabled={loading}
              />
            </div>
          )}
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="signupStatus">Sign up as</label>
              <select
                id="signupStatus"
                value={signupStatus}
                onChange={(e) => setSignupStatus(e.target.value)}
                disabled={loading}
              >
                <option value="prospective">Prospective member</option>
                <option value="inducted">Already inducted member</option>
                <option value="officer">E-board member</option>
              </select>
              <p className="muted">
                Choose the option that best describes you right now. Inducted and e-board selections
                will be checked against WICS records.
              </p>
            </div>
          )}
          {isSignUp && signupStatus === 'officer' && (
            <>
              <div className="form-group">
                <label htmlFor="officerYear">Academic year</label>
                <select
                  id="officerYear"
                  value={officerYear}
                  onChange={(e) => setOfficerYear(e.target.value)}
                  disabled={loading}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
                <p className="muted">
                  Officers can only serve for the current academic year. Choose the year you are
                  currently on the WICS e-board.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="officerRole">Officer role</label>
                <input
                  id="officerRole"
                  type="text"
                  value={officerRole}
                  onChange={(e) => setOfficerRole(e.target.value)}
                  placeholder="e.g., President, Vice President, Treasurer"
                  disabled={loading}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@morgan.edu"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Min 6 characters' : ''}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="toggle-mode">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
