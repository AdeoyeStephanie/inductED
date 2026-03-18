/**
 * Main App: Sets up React Router, AuthProvider, and all routes.
 * - /login: Login & signup (public)
 * - /dashboard: Personal dashboard (protected, any logged-in user)
 * - /submit: Submit point claim (protected, prospective only)
 * - /officer: Officer approval dashboard (protected, officers only)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Submit from './pages/Submit';
import Officer from './pages/Officer';
import Notifications from './pages/Notifications';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public: login and signup */}
            <Route path="/login" element={<Login />} />

            {/* Protected: dashboard for any logged-in user */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected: notifications — claim status (no officer info) */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Protected: submit only for prospective members */}
            <Route
              path="/submit"
              element={
                <ProtectedRoute requireRole="prospective">
                  <Submit />
                </ProtectedRoute>
              }
            />

            {/* Protected: officer dashboard only for officers */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute requireRole="officer">
                  <Officer />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard (or login if not authenticated) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all: send unknown paths to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
