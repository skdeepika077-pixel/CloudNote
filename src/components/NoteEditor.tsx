import React, { useEffect, useState } from 'react';
import {
  X,
  Pin,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';
import type { Note } from '../types/note';
import {
  createNote,
  updateNote,
  toggleNotePin,
  NOTE_TITLE_MAX_LENGTH,
  NOTE_CONTENT_MAX_LENGTH,
} from '../services/notesService';
import { formatFullDateTime, countWords } from '../utils/formatters';
import { getFriendlyFirestoreError } from '../firebase/errors';
import { useToast } from '../context/ToastContext';

interface NoteEditorProps {
  isOpen: boolean;
  userId: string;
  initialNote: Note | null;
  defaultPinned?: boolean;
  onClose: () => void;
  onRequestDelete: (note: Note) => void;
}

export function NoteEditor({
  isOpen,
  userId,
  initialNote,
  defaultPinned = false,
  onClose,
  onRequestDelete,
}: NoteEditorProps) {
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialNote?.title ?? '');
  const [content, setContent] = useState(initialNote?.content ?? '');
  const [isPinned, setIsPinned] = useState(initialNote?.isPinned ?? defaultPinned);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditing = Boolean(initialNote);

  useEffect(() => {
    setTitle(initialNote?.title ?? '');
    setContent(initialNote?.content ?? '');
    setIsPinned(initialNote?.isPinned ?? defaultPinned);
    setSaveError(null);
  }, [initialNote, defaultPinned, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);

    const trimmedTitle = title.slice(0, NOTE_TITLE_MAX_LENGTH);
    const trimmedContent = content.slice(0, NOTE_CONTENT_MAX_LENGTH);

    if (!trimmedTitle.trim() && !trimmedContent.trim()) {
      setSaveError('Please enter a note title or content before saving.');
      return;
    }

    setIsSaving(true);
    try {
      if (initialNote) {
        await updateNote(userId, initialNote.id, {
          title: trimmedTitle,
          content: trimmedContent,
        });
        if (isPinned !== initialNote.isPinned) {
          await toggleNotePin(userId, initialNote.id, isPinned);
        }
        showToast('success', 'Note updated', 'Changes saved to Cloud Firestore.');
      } else {
        await createNote(userId, {
          title: trimmedTitle,
          content: trimmedContent,
          isPinned,
        });
        showToast('success', 'Note created', 'Saved to Cloud Firestore.');
      }
      onClose();
    } catch (err) {
      const msg = getFriendlyFirestoreError(err);
      setSaveError(msg);
      showToast('error', 'Failed to save note', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const words = countWords(content);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#242424]/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-editor-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#EAECEF] bg-white shadow-[0_24px_60px_-14px_rgba(36,36,36,0.22)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EAECEF] bg-[#FFFBE9]/70 px-6 py-4">
          <h2
            id="note-editor-modal-title"
            className="font-display text-lg font-bold text-[#242424]"
          >
            {isEditing ? 'Edit Note' : 'New Note'}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              aria-pressed={isPinned}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] whitespace-nowrap ${
                isPinned
                  ? 'border-[#263F79] bg-[#263F79] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#595C66] hover:text-[#242424]'
              }`}
            >
              <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-current' : ''}`} />
              <span>{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              aria-label="Close note editor"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#929292] transition-colors hover:bg-white hover:text-[#242424] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {saveError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] p-3 text-sm text-[#991B1B]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />
                <span>{saveError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="modal-note-title"
                className="mb-1.5 block text-xs font-semibold text-[#6E717A]"
              >
                Note Title
              </label>
              <input
                id="modal-note-title"
                type="text"
                autoFocus
                maxLength={NOTE_TITLE_MAX_LENGTH}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 font-display text-lg font-semibold text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
              />
            </div>

            <div>
              <label
                htmlFor="modal-note-content"
                className="mb-1.5 block text-xs font-semibold text-[#6E717A]"
              >
                Note Content
              </label>
              <textarea
                id="modal-note-content"
                maxLength={NOTE_CONTENT_MAX_LENGTH}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content..."
                rows={10}
                className="min-h-[240px] w-full resize-y rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm leading-relaxed text-[#242424] placeholder-[#929292] transition-colors focus:border-[#263F79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#263F79]/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6E717A]">
              {initialNote && (
                <>
                  <span className="tabular-nums">
                    Last updated: {formatFullDateTime(initialNote.updatedAt)}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="tabular-nums">{words} words</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {content.length.toLocaleString()} / {NOTE_CONTENT_MAX_LENGTH.toLocaleString()} chars
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAECEF] bg-[#F6F7F9] px-6 py-4">
            <div>
              {initialNote && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onRequestDelete(initialNote)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#F5C2C7] bg-white px-3.5 py-2 text-sm font-medium text-[#DC2626] transition-colors hover:bg-[#FFF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] disabled:opacity-50 whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#242424] transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#263F79] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E3262] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
