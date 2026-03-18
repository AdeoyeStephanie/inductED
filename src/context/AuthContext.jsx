/**
 * AuthContext: Provides the current Firebase user and their Firestore profile to the whole app.
 * Use useAuth() in any component to get { user, profile, loading }.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../firebase/authHelpers';
import { getUserRole } from '../firebase/roleHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      const userProfile = await getUserRole(firebaseUser.uid);
      setProfile(userProfile);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { user, profile, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
