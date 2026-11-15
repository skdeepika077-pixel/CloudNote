import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthPages } from './components/AuthPages';
import { Dashboard } from './components/Dashboard';
import { BrandLogo } from './components/BrandLogo';

function AppShell() {
  const { user, authReady } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (!authReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F8] px-4">
        <div className="flex flex-col items-center rounded-2xl border border-[#EAECEF] bg-white px-10 py-8 shadow-[0_8px_24px_-8px_rgba(36,36,36,0.08)]">
          <BrandLogo size="lg" />
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#6F727A]">
            <Loader2 className="h-4 w-4 animate-spin text-[#263F79]" />
            <span>Loading CloudNote...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#242424]">
      {!user ? (
        <AuthPages mode={authMode} onSwitchMode={setAuthMode} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
