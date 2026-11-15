import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Menu,
  X,
  Plus,
  Folder,
  Pin,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  AlertCircle,
  LogOut,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  subscribeToNotes,
  toggleNotePin,
  deleteNote,
  createNote,
} from '../services/notesService';
import { getFriendlyFirestoreError } from '../firebase/errors';
import {
  formatCreationDate,
  formatDateRangeLabel,
  isDateInTimeframe,
  stepReferenceDate,
} from '../utils/formatters';
import type {
  CollectionFilter,
  Note,
  SidebarSection,
  TimeframeFilter,
} from '../types/note';
import { Sidebar } from './Sidebar';
import { NoteCard, getNotePastelVariant } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { ConfirmModal } from './ConfirmModal';
import { BrandLogo } from './BrandLogo';

export function Dashboard() {
  const { user, logout, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>('notes');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop profile/hamburger menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Folder section timeframe & dropdown menu
  const [folderTimeframe, setFolderTimeframe] = useState<TimeframeFilter>('month');
  const [openFolderMenu, setOpenFolderMenu] = useState<CollectionFilter | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionFilter>('all');

  // My Notes section timeframe & date navigation
  const [notesTimeframe, setNotesTimeframe] = useState<TimeframeFilter>('all');
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  // Session trash for restoring notes deleted during the current session back into Firestore
  const [sessionTrash, setSessionTrash] = useState<Note[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    note: Note | null;
    defaultPinned?: boolean;
  }>({ isOpen: false, note: null });

  const [notePendingDelete, setNotePendingDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoadingNotes(true);
    setLoadError(null);

    const unsubscribe = subscribeToNotes(
      user.uid,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setIsLoadingNotes(false);
        setLoadError(null);
      },
      (err) => {
        setIsLoadingNotes(false);
        setLoadError(getFriendlyFirestoreError(err));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (!(e.target as HTMLElement)?.closest('[data-folder-menu]')) {
        setOpenFolderMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pinnedNotes = useMemo(() => notes.filter((n) => n.isPinned), [notes]);
  const recentFolderNotes = useMemo(
    () =>
      notes.filter((n) =>
        isDateInTimeframe(n.updatedAt ?? n.createdAt, folderTimeframe, new Date())
      ),
    [notes, folderTimeframe]
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const base = notes.filter((note) => {
      if (sidebarSection === 'archive' && note.isPinned) {
        return false;
      }
      if (sidebarSection === 'notes' && activeCollection === 'pinned' && !note.isPinned) {
        return false;
      }
      if (
        sidebarSection === 'notes' &&
        activeCollection === 'recent' &&
        !isDateInTimeframe(note.updatedAt ?? note.createdAt, folderTimeframe, new Date())
      ) {
        return false;
      }
      if (
        (sidebarSection === 'notes' || sidebarSection === 'calendar') &&
        notesTimeframe !== 'all' &&
        !isDateInTimeframe(note.updatedAt ?? note.createdAt, notesTimeframe, referenceDate)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
      );
    });

    return [...base].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      const timeA = a.updatedAt?.toMillis?.() ?? Date.now();
      const timeB = b.updatedAt?.toMillis?.() ?? Date.now();
      return timeB - timeA;
    });
  }, [
    notes,
    searchQuery,
    sidebarSection,
    activeCollection,
    folderTimeframe,
    notesTimeframe,
    referenceDate,
  ]);

  if (!user) return null;

  const displayName =
    user.displayName || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const handleOpenCreate = (defaultPinned = false) => {
    setEditorState({ isOpen: true, note: null, defaultPinned });
  };

  const handleOpenEdit = (note: Note) => {
    setEditorState({ isOpen: true, note });
  };

  const handleTogglePin = async (note: Note) => {
    const nextPinned = !note.isPinned;
    try {
      await toggleNotePin(user.uid, note.id, nextPinned);
      showToast(
        'success',
        nextPinned ? 'Note pinned' : 'Note unpinned',
        nextPinned
          ? `"${note.title || 'Untitled Note'}" pinned to top.`
          : `"${note.title || 'Untitled Note'}" unpinned.`
      );
    } catch (err) {
      showToast('error', 'Failed to update pin', getFriendlyFirestoreError(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!notePendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteNote(user.uid, notePendingDelete.id);
      setSessionTrash((prev) => [notePendingDelete, ...prev]);
      showToast(
        'success',
        'Note deleted',
        `"${notePendingDelete.title || 'Untitled Note'}" removed from Firestore. You can restore it from Trash during this session.`
      );
      if (editorState.isOpen && editorState.note?.id === notePendingDelete.id) {
        setEditorState({ isOpen: false, note: null });
      }
      setNotePendingDelete(null);
    } catch (err) {
      showToast('error', 'Failed to delete note', getFriendlyFirestoreError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreNote = async (trashed: Note) => {
    setRestoringId(trashed.id);
    try {
      await createNote(user.uid, {
        title: trashed.title,
        content: trashed.content,
        isPinned: trashed.isPinned,
      });
      setSessionTrash((prev) => prev.filter((item) => item.id !== trashed.id));
      showToast('success', 'Note restored', `"${trashed.title || 'Untitled Note'}" restored to Firestore.`);
    } catch (err) {
      showToast('error', 'Restore failed', getFriendlyFirestoreError(err));
    } finally {
      setRestoringId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('info', 'Signed out', 'You have been securely logged out.');
    } catch {
      showToast('error', 'Sign out error', 'Could not sign out. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      showToast(
        'success',
        'Verification email sent',
        `Check ${user.email} for your verification link.`
      );
    } catch {
      showToast(
        'error',
        'Could not send verification email',
        'Please wait a moment and try again.'
      );
    }
  };

  const smartCollections: {
    id: CollectionFilter;
    name: string;
    bgClass: string;
    icon: typeof Folder;
    count: number;
    latestTs: Note['updatedAt'];
  }[] = [
    {
      id: 'all',
      name: 'All Cloud Notes',
      bgClass: 'bg-[#DDF1FC]',
      icon: Folder,
      count: notes.length,
      latestTs: notes[0]?.updatedAt ?? notes[0]?.createdAt ?? null,
    },
    {
      id: 'pinned',
      name: 'Pinned Notes',
      bgClass: 'bg-[#FFDAD7]',
      icon: Pin,
      count: pinnedNotes.length,
      latestTs: pinnedNotes[0]?.updatedAt ?? pinnedNotes[0]?.createdAt ?? null,
    },
    {
      id: 'recent',
      name:
        folderTimeframe === 'today'
          ? "Today's Notes"
          : folderTimeframe === 'week'
            ? 'This Week'
            : 'This Month',
      bgClass: 'bg-[#FFFBE9]',
      icon: Clock,
      count: recentFolderNotes.length,
      latestTs: recentFolderNotes[0]?.updatedAt ?? recentFolderNotes[0]?.createdAt ?? null,
    },
  ];

  const handleSelectSection = (section: SidebarSection) => {
    setSidebarSection(section);
    if (section === 'calendar') {
      setNotesTimeframe('today');
      setReferenceDate(new Date());
    } else if (section === 'notes') {
      setNotesTimeframe('all');
    }
  };

  const activeDateLabel =
    notesTimeframe === 'all'
      ? formatDateRangeLabel('month', referenceDate)
      : formatDateRangeLabel(notesTimeframe, referenceDate);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#242424]">
      {/* Horizontal White Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#EAECEF] bg-white">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: CloudNote Logo, CLOUDNOTE Brand, Large MY NOTES Heading */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <BrandLogo size="md" uppercase />
            <div className="hidden h-6 w-px bg-[#EAECEF] sm:block" aria-hidden="true" />
            <h1 className="hidden font-display text-lg font-extrabold tracking-wide text-[#242424] sm:block md:text-xl whitespace-nowrap">
              {sidebarSection === 'calendar'
                ? 'CALENDAR'
                : sidebarSection === 'archive'
                  ? 'ARCHIVE'
                  : sidebarSection === 'trash'
                    ? 'TRASH'
                    : 'MY NOTES'}
            </h1>
          </div>

          {/* Center: Search Input */}
          <div className="relative flex-1 max-w-md mx-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
              className="min-h-[40px] w-full rounded-xl border border-[#EAECEF] bg-[#F5F6F8] py-2 pl-10 pr-9 text-sm text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#929292] hover:bg-[#EAECEF] hover:text-[#242424]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Display Name, Avatar, Hamburger Menu */}
          <div className="relative flex items-center gap-3 shrink-0" ref={userMenuRef}>
            <span className="hidden text-sm font-medium text-[#242424] md:inline whitespace-nowrap">
              {displayName}
            </span>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full border border-[#EAECEF] object-cover"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDF1FC] font-display text-xs font-bold text-[#263F79]"
                aria-hidden="true"
              >
                {initials || 'U'}
              </div>
            )}

            {/* Mobile Hamburger toggles sidebar; Desktop Hamburger toggles user menu */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#242424] transition-colors hover:bg-[#F5F6F8] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="Account menu"
              aria-expanded={isUserMenuOpen}
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#242424] transition-colors hover:bg-[#F5F6F8] md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79]"
            >
              <Menu className="h-5 w-5" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-12 z-40 w-60 rounded-2xl border border-[#EAECEF] bg-white p-2 shadow-[0_14px_34px_-10px_rgba(36,36,36,0.16)]">
                <div className="border-b border-[#F0F1F4] px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-[#242424]">{displayName}</p>
                  <p className="truncate text-xs text-[#6E717A]">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleOpenCreate(false);
                  }}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#242424] hover:bg-[#F5F6F8]"
                >
                  <Plus className="h-4 w-4 text-[#263F79]" />
                  <span>New Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FFF5F5]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          user={user}
          activeSection={sidebarSection}
          trashedCount={sessionTrash.length}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onSelectSection={handleSelectSection}
          onAddNew={() => handleOpenCreate(false)}
          onLogout={handleLogout}
          onResendVerification={handleResendVerification}
        />

        {/* Main Content Canvas */}
        <main className="min-w-0 flex-1 bg-[#F6F7F9] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[1180px] space-y-10">
            {/* Error Banner */}
            {loadError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-[#F5C2C7] bg-white p-4 text-sm text-[#991B1B]"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
                <div>
                  <p className="font-semibold">Unable to load notes</p>
                  <p className="mt-0.5 text-xs text-[#6E717A]">{loadError}</p>
                </div>
              </div>
            )}

            {sidebarSection === 'trash' ? (
              /* Trash View (Session Deleted Notes with Restore to Firestore) */
              <section aria-labelledby="trash-heading">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      id="trash-heading"
                      className="font-display text-xl font-bold text-[#242424]"
                    >
                      Trash
                    </h2>
                    <p className="mt-1 text-sm text-[#6E717A]">
                      Notes deleted during this session can be restored back to Cloud Firestore.
                    </p>
                  </div>
                  {sessionTrash.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSessionTrash([])}
                      className="inline-flex min-h-[38px] items-center rounded-xl border border-[#EAECEF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#6E717A] hover:text-[#242424]"
                    >
                      Clear Session List
                    </button>
                  )}
                </div>

                {sessionTrash.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8DCE3] bg-white px-6 py-16 text-center">
                    <FileText className="h-8 w-8 text-[#929292]" />
                    <h3 className="mt-3 font-display text-base font-semibold text-[#242424]">
                      Trash is empty
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-[#6E717A]">
                      Deleted notes from your current session will appear here if you need to restore them.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {sessionTrash.map((trashed) => (
                      <article
                        key={trashed.id}
                        className="flex min-h-[200px] flex-col justify-between rounded-2xl border border-[#EAECEF] bg-white p-6"
                      >
                        <div>
                          <span className="text-xs font-medium text-[#929292] tabular-nums">
                            {formatCreationDate(trashed.createdAt)}
                          </span>
                          <h3 className="mt-2 font-display truncate text-base font-bold text-[#242424]">
                            {trashed.title || 'Untitled Note'}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm text-[#6E717A]">
                            {trashed.content || 'Empty note'}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-end border-t border-[#F0F1F4] pt-3">
                          <button
                            type="button"
                            disabled={restoringId === trashed.id}
                            onClick={() => handleRestoreNote(trashed)}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#263F79] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3262] disabled:opacity-60"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>
                              {restoringId === trashed.id ? 'Restoring...' : 'Restore Note'}
                            </span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Section A: Recent Folders (Smart Collections derived from Firestore) */}
                {sidebarSection === 'notes' && (
                  <section aria-labelledby="recent-folders-heading">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2
                          id="recent-folders-heading"
                          className="font-display text-xl font-bold text-[#242424]"
                        >
                          Recent Folders
                        </h2>
                        <div
                          role="tablist"
                          aria-label="Filter recent folders"
                          className="mt-3 inline-flex items-center gap-5 border-b border-[#EAECEF]"
                        >
                          {(
                            [
                              { id: 'today', label: 'Today' },
                              { id: 'week', label: 'This Week' },
                              { id: 'month', label: 'This Month' },
                            ] as const
                          ).map((tab) => {
                            const isActive = folderTimeframe === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setFolderTimeframe(tab.id)}
                                className={`relative pb-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                                  isActive
                                    ? 'text-[#242424] font-semibold'
                                    : 'text-[#7A7D85] hover:text-[#242424]'
                                }`}
                              >
                                {tab.label}
                                {isActive && (
                                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#263F79]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Row of Pastel Smart Collection Cards */}
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                      {smartCollections.map((folder) => {
                        const Icon = folder.icon;
                        const isSelected = activeCollection === folder.id;
                        return (
                          <div
                            key={folder.id}
                            data-folder-menu
                            className={`relative rounded-2xl ${folder.bgClass} p-5 transition-all duration-150 hover:shadow-[0_10px_24px_-10px_rgba(36,36,36,0.14)] ${
                              isSelected ? 'ring-2 ring-[#263F79]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCollection(folder.id);
                                  if (folder.id === 'recent') {
                                    setNotesTimeframe(folderTimeframe);
                                    setReferenceDate(new Date());
                                  } else {
                                    setNotesTimeframe('all');
                                  }
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#263F79] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79]"
                                aria-label={`Filter by ${folder.name}`}
                              >
                                <Icon className="h-5 w-5" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenFolderMenu((prev) =>
                                    prev === folder.id ? null : folder.id
                                  )
                                }
                                aria-label={`${folder.name} options`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#595C66] transition-colors hover:bg-white/65 hover:text-[#242424]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveCollection(folder.id);
                                if (folder.id === 'recent') {
                                  setNotesTimeframe(folderTimeframe);
                                  setReferenceDate(new Date());
                                } else {
                                  setNotesTimeframe('all');
                                }
                              }}
                              className="mt-4 block w-full text-left focus-visible:outline-none"
                            >
                              <h3 className="font-display text-base font-bold text-[#242424]">
                                {folder.name}
                              </h3>
                              <p className="mt-1 text-xs font-medium text-[#595C66] tabular-nums">
                                {folder.count} {folder.count === 1 ? 'note' : 'notes'} · Updated{' '}
                                {folder.latestTs ? formatCreationDate(folder.latestTs) : '—'}
                              </p>
                            </button>

                            {openFolderMenu === folder.id && (
                              <div className="absolute right-4 top-14 z-20 w-44 rounded-xl border border-[#EAECEF] bg-white p-1.5 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCollection(folder.id);
                                    setOpenFolderMenu(null);
                                  }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#242424] hover:bg-[#F5F6F8]"
                                >
                                  Show these notes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenFolderMenu(null);
                                    handleOpenCreate(folder.id === 'pinned');
                                  }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#263F79] hover:bg-[#F5F6F8]"
                                >
                                  {folder.id === 'pinned' ? 'New pinned note' : 'New note'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Section B: My Notes */}
                <section aria-labelledby="my-notes-heading">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2
                          id="my-notes-heading"
                          className="font-display text-xl font-bold text-[#242424]"
                        >
                          {sidebarSection === 'archive'
                            ? 'Archive (Unpinned Notes)'
                            : sidebarSection === 'calendar'
                              ? 'Notes by Date'
                              : activeCollection === 'pinned'
                                ? 'Pinned Notes'
                                : 'My Notes'}
                        </h2>
                        {activeCollection !== 'all' && sidebarSection === 'notes' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCollection('all');
                              setNotesTimeframe('all');
                            }}
                            className="text-xs font-semibold text-[#263F79] hover:underline"
                          >
                            Show all
                          </button>
                        )}
                      </div>

                      {/* Filter Tabs */}
                      <div
                        role="tablist"
                        aria-label="Filter notes by date"
                        className="mt-3 inline-flex items-center gap-5 border-b border-[#EAECEF]"
                      >
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'today', label: 'Today' },
                            { id: 'week', label: 'This Week' },
                            { id: 'month', label: 'This Month' },
                          ] as const
                        ).map((tab) => {
                          const isActive = notesTimeframe === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              onClick={() => {
                                setNotesTimeframe(tab.id);
                                setReferenceDate(new Date());
                              }}
                              className={`relative pb-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                                isActive
                                  ? 'text-[#242424] font-semibold'
                                  : 'text-[#7A7D85] hover:text-[#242424]'
                              }`}
                            >
                              {tab.label}
                              {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#263F79]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date Navigation Control on the Right */}
                    <div className="flex items-center gap-2 self-start rounded-xl border border-[#EAECEF] bg-white px-2.5 py-1.5 sm:self-end">
                      <button
                        type="button"
                        onClick={() => {
                          const stepMode =
                            notesTimeframe === 'all' ? 'month' : notesTimeframe;
                          if (notesTimeframe === 'all') setNotesTimeframe('month');
                          setReferenceDate((prev) =>
                            stepReferenceDate(prev, stepMode, -1)
                          );
                        }}
                        aria-label="Previous date range"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#595C66] hover:bg-[#F5F6F8] hover:text-[#242424]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setReferenceDate(new Date())}
                        title="Jump to current date"
                        className="inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-[#242424] tabular-nums whitespace-nowrap"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-[#263F79]" />
                        <span>{activeDateLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const stepMode =
                            notesTimeframe === 'all' ? 'month' : notesTimeframe;
                          if (notesTimeframe === 'all') setNotesTimeframe('month');
                          setReferenceDate((prev) =>
                            stepReferenceDate(prev, stepMode, 1)
                          );
                        }}
                        aria-label="Next date range"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#595C66] hover:bg-[#F5F6F8] hover:text-[#242424]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Grid */}
                  {isLoadingNotes ? (
                    <div
                      aria-label="Loading notes"
                      className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                    >
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="min-h-[228px] rounded-2xl border border-[#EAECEF] bg-white p-6"
                        >
                          <div className="h-3.5 w-24 rounded bg-[#ECEEF2]" />
                          <div className="mt-4 h-5 w-2/3 rounded bg-[#E4E7EC]" />
                          <div className="mt-3 space-y-2">
                            <div className="h-3.5 w-full rounded bg-[#F1F3F6]" />
                            <div className="h-3.5 w-5/6 rounded bg-[#F1F3F6]" />
                            <div className="h-3.5 w-4/6 rounded bg-[#F1F3F6]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {filteredNotes.map((note, idx) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          variant={getNotePastelVariant(note.id, idx)}
                          onOpen={handleOpenEdit}
                          onTogglePin={handleTogglePin}
                          onRequestDelete={(n) => setNotePendingDelete(n)}
                        />
                      ))}

                      {/* Dashed-border New Note Card at the End of the Grid */}
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(activeCollection === 'pinned')}
                        className="flex min-h-[228px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D2D6DF] bg-white/70 p-6 text-[#595C66] transition-all duration-150 hover:border-[#263F79] hover:bg-white hover:text-[#263F79] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6F8] text-[#263F79]">
                          <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-display text-sm font-semibold">
                          New Note
                        </span>
                      </button>
                    </div>
                  )}

                  {!isLoadingNotes && filteredNotes.length === 0 && (
                    <p className="mt-4 text-sm text-[#6E717A]">
                      {searchQuery.trim()
                        ? `No notes matched "${searchQuery}". Clear your search or click New Note above.`
                        : notesTimeframe !== 'all'
                          ? 'No notes found in this date range. Switch to "All" or create a new note.'
                          : 'Click "New Note" to create your first cloud-synced note.'}
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteEditor
        isOpen={editorState.isOpen}
        userId={user.uid}
        initialNote={editorState.note}
        defaultPinned={editorState.defaultPinned}
        onClose={() => setEditorState({ isOpen: false, note: null })}
        onRequestDelete={(note) => setNotePendingDelete(note)}
      />

      <ConfirmModal
        isOpen={Boolean(notePendingDelete)}
        title="Delete this note?"
        description={`"${notePendingDelete?.title || 'Untitled Note'}" will be permanently deleted from Cloud Firestore.`}
        confirmLabel="Delete Note"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNotePendingDelete(null)}
      />
    </div>
  );
}
