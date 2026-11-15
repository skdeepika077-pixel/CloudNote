import { useState } from 'react';
import {
  Plus,
  Calendar,
  Archive,
  Trash2,
  StickyNote,
  X,
  LogOut,
  Loader2,
  MailCheck,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { SidebarSection } from '../types/note';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  user: User;
  activeSection: SidebarSection;
  trashedCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectSection: (section: SidebarSection) => void;
  onAddNew: () => void;
  onLogout: () => Promise<void>;
  onResendVerification: () => Promise<void>;
}

export function Sidebar({
  user,
  activeSection,
  trashedCount,
  isMobileOpen,
  onCloseMobile,
  onSelectSection,
  onAddNew,
  onLogout,
  onResendVerification,
}: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleVerifyClick = async () => {
    setIsSendingVerification(true);
    try {
      await onResendVerification();
    } finally {
      setIsSendingVerification(false);
    }
  };

  const navItems: {
    id: SidebarSection;
    label: string;
    icon: typeof StickyNote;
    count?: number;
  }[] = [
    { id: 'notes', label: 'My Notes', icon: StickyNote },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'archive', label: 'Archive', icon: Archive },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      count: trashedCount > 0 ? trashedCount : undefined,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-5 py-6">
      <div>
        {/* Mobile drawer header */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <BrandLogo size="sm" uppercase />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-[#929292] hover:bg-[#F5F6F8] hover:text-[#242424]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add New CTA */}
        <button
          type="button"
          onClick={() => {
            onAddNew();
            onCloseMobile();
          }}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#263F79] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(38,63,121,0.45)] transition-colors hover:bg-[#1E3262] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </button>

        {/* Sidebar Navigation */}
        <nav aria-label="Sidebar navigation" className="mt-7 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`flex min-h-[42px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F5F6F8] text-[#263F79] font-semibold'
                    : 'text-[#595C66] hover:bg-[#F6F7F9] hover:text-[#242424]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      isActive ? 'text-[#263F79]' : 'text-[#929292]'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span className="font-mono text-xs tabular-nums text-[#929292]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom CloudNote Illustration & Logout */}
      <div className="space-y-3 border-t border-[#EAECEF] pt-5">
        {!user.emailVerified && user.email && (
          <div className="rounded-xl border border-[#DDF1FC] bg-[#F5FAFE] p-3 text-xs text-[#263F79]">
            <p className="font-medium">Email verification pending</p>
            <button
              type="button"
              disabled={isSendingVerification}
              onClick={handleVerifyClick}
              className="mt-1 inline-flex items-center gap-1.5 font-semibold text-[#263F79] underline-offset-2 hover:underline disabled:opacity-60"
            >
              {isSendingVerification ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MailCheck className="h-3.5 w-3.5" />
              )}
              <span>Resend verification</span>
            </button>
          </div>
        )}

        {/* Minimal Pastel CloudNote Desk Illustration */}
        <div className="rounded-2xl bg-[#F6F7F9] p-4 text-center">
          <svg
            viewBox="0 0 120 72"
            fill="none"
            className="mx-auto h-16 w-auto"
            aria-hidden="true"
          >
            <rect x="18" y="20" width="38" height="44" rx="6" fill="#F0E989" />
            <rect x="64" y="14" width="38" height="44" rx="6" fill="#DDF1FC" />
            <rect x="40" y="10" width="40" height="48" rx="7" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
            <path d="M49 24h22M49 32h16M49 40h18" stroke="#263F79" strokeWidth="2" strokeLinecap="round" />
            <circle cx="88" cy="48" r="9" fill="#FFDAD7" />
          </svg>
          <p className="mt-2 font-display text-xs font-semibold text-[#242424]">
            CloudNote Workspace
          </p>
          <p className="mt-0.5 text-[11px] text-[#7A7D85]">
            Synced with Cloud Firestore
          </p>
        </div>

        <button
          type="button"
          disabled={isLoggingOut}
          onClick={handleLogoutClick}
          className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[#EAECEF] bg-white px-3 py-2 text-sm font-medium text-[#595C66] transition-colors hover:bg-[#F5F6F8] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] disabled:opacity-60 whitespace-nowrap"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden shrink-0 border-r border-[#EAECEF] bg-white md:block md:w-[216px] lg:w-[244px]">
        <div className="sticky top-[73px] h-[calc(100vh-73px)]">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#242424]/30"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-[264px] max-w-[85vw] border-r border-[#EAECEF] bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
