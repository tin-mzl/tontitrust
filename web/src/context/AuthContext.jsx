import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setLoading(false);
      });
      return () => unsubProfile();
    });

    return () => unsubAuth();
  }, []);

  const value = useMemo(() => ({
    user: firebaseUser,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isKycValidated: profile?.kycStatus === 'validated' && !profile?.suspended
  }), [firebaseUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
