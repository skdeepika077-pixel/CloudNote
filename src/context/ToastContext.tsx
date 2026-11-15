import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage, ToastType } from '../types/note';

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
                ? AlertCircle
                : Info;

          const toneClasses =
            toast.type === 'success'
              ? 'border-[#D1E7DD] bg-white text-[#242424]'
              : toast.type === 'error'
                ? 'border-[#F5C2C7] bg-white text-[#242424]'
                : 'border-[#E5E7EB] bg-white text-[#242424]';

          const iconClasses =
            toast.type === 'success'
              ? 'text-[#16A34A]'
              : toast.type === 'error'
                ? 'text-[#DC2626]'
                : 'text-[#263F79]';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-[0_10px_28px_-8px_rgba(36,36,36,0.12)] transition-all duration-150 ${toneClasses}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClasses}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-[#242424]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6E717A]">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-[#929292] transition-colors hover:bg-[#F5F6F8] hover:text-[#242424] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
