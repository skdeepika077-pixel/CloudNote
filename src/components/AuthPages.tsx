import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getFriendlyAuthError } from '../firebase/errors';
import { BrandLogo } from './BrandLogo';

interface AuthPagesProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export function AuthPages({ mode, onSwitchMode }: AuthPagesProps) {
  const { registerWithEmail, loginWithEmail, loginWithGoogle, isConfigured } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerDisabled, setProviderDisabled] = useState(false);

  const isRegister = mode === 'register';

  const handleModeChange = (nextMode: 'login' | 'register') => {
    setErrorMessage(null);
    setProviderDisabled(false);
    onSwitchMode(nextMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setProviderDisabled(false);

    if (!isConfigured) {
      setErrorMessage(
        'Firebase credentials are not configured. Update firebase-applet-config.json or .env before signing in.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both fields.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(name, trimmedEmail, password);
        showToast('success', 'Account created', 'Welcome to your CloudNote workspace.');
      } else {
        await loginWithEmail(trimmedEmail, password);
        showToast('success', 'Signed in', 'Your notes are synchronized from Cloud Firestore.');
      }
    } catch (err) {
      const friendly = getFriendlyAuthError(err);
      setErrorMessage(friendly.message);
      setProviderDisabled(Boolean(friendly.isProviderDisabled));
      showToast('error', isRegister ? 'Registration failed' : 'Sign in failed', friendly.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setProviderDisabled(false);

    if (!isConfigured) {
      setErrorMessage('Firebase credentials are not configured.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('success', 'Signed in with Google', 'Your cloud workspace is ready.');
    } catch (err) {
      const friendly = getFriendlyAuthError(err);
      setErrorMessage(friendly.message);
      showToast('error', 'Google sign-in failed', friendly.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F8] px-4 py-10 sm:px-6">
      <div className="w-full max-w-[440px] rounded-2xl border border-[#EAECEF] bg-white p-7 shadow-[0_12px_32px_-12px_rgba(36,36,36,0.08)] sm:p-9">
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" uppercase />
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-[#242424] text-balance">
            Your thoughts, beautifully organized.
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6E717A]">
            {isRegister
              ? 'Create your CloudNote account to write, pin, and organize notes in the cloud.'
              : 'Sign in to access your pastel workspace and cloud-synced notes.'}
          </p>
        </div>

        {/* Sign In / Register Tabs */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-[#F5F6F8] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            onClick={() => handleModeChange('login')}
            className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
              !isRegister
                ? 'bg-white text-[#242424] shadow-xs'
                : 'text-[#6E717A] hover:text-[#242424]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            onClick={() => handleModeChange('register')}
            className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
              isRegister
                ? 'bg-white text-[#242424] shadow-xs'
                : 'text-[#6E717A] hover:text-[#242424]'
            }`}
          >
            Register
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] p-3.5 text-sm text-[#991B1B]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
            <div className="space-y-1">
              <p className="leading-snug">{errorMessage}</p>
              {providerDisabled && (
                <p className="text-xs text-[#7F1D1D]">
                  Tip: In Firebase Console, open <strong>Authentication → Sign-in method</strong>{' '}
                  and enable <strong>Email/Password</strong>, or sign in immediately with Google below.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {isRegister && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1.5 block text-sm font-medium text-[#242424]"
              >
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-10 pr-3.5 text-sm text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-sm font-medium text-[#242424]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-10 pr-3.5 text-sm text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-sm font-medium text-[#242424]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-10 pr-11 text-sm text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#929292] transition-colors hover:bg-[#EAECEF] hover:text-[#242424] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="mb-1.5 block text-sm font-medium text-[#242424]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]" />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-10 pr-3.5 text-sm text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#263F79] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3262] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isRegister ? 'Creating account...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#EAECEF]" />
          <span className="text-xs font-medium text-[#929292]">or continue with</span>
          <div className="h-px flex-1 bg-[#EAECEF]" />
        </div>

        <button
          type="button"
          disabled={isSubmitting || isGoogleLoading}
          onClick={handleGoogleSignIn}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#242424] transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] disabled:opacity-60 whitespace-nowrap"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#263F79]" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-[#6E717A]">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => handleModeChange(isRegister ? 'login' : 'register')}
            className="font-semibold text-[#263F79] hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </main>
  );
}
