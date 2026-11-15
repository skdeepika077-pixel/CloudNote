import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { syncUserProfile, DISPLAY_NAME_MAX_LENGTH } from '../services/notesService';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  isConfigured: boolean;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser) {
        try {
          await syncUserProfile(firebaseUser);
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const trimmedName = name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }

      await syncUserProfile(credential.user, trimmedName);

      try {
        await sendEmailVerification(credential.user);
      } catch {
        // Non-fatal if verification email dispatch fails
      }
    },
    []
  );

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await syncUserProfile(credential.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, provider);
    await syncUserProfile(credential.user);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        isConfigured: isFirebaseConfigured,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
