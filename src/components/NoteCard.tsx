import { Pin, Pencil, Trash2, Clock } from 'lucide-react';
import type { Note } from '../types/note';
import { formatCreationDate, formatTimeOnly } from '../utils/formatters';

export type PastelVariant = 'yellow' | 'pink' | 'blue' | 'lavender';

const VARIANT_CLASSES: Record<
  PastelVariant,
  {
    card: string;
    divider: string;
    muted: string;
    iconHover: string;
    pinActive: string;
  }
> = {
  yellow: {
    card: 'bg-[#F0E989]',
    divider: 'border-[#242424]/12',
    muted: 'text-[#4B492D]',
    iconHover: 'hover:bg-white/45',
    pinActive: 'bg-[#263F79] text-white',
  },
  pink: {
    card: 'bg-[#F5B0B2]',
    divider: 'border-[#242424]/12',
    muted: 'text-[#553133]',
    iconHover: 'hover:bg-white/45',
    pinActive: 'bg-[#263F79] text-white',
  },
  blue: {
    card: 'bg-[#70B9DF]',
    divider: 'border-[#242424]/12',
    muted: 'text-[#1E3B4D]',
    iconHover: 'hover:bg-white/40',
    pinActive: 'bg-[#263F79] text-white',
  },
  lavender: {
    card: 'bg-[#A9A0F4]',
    divider: 'border-[#242424]/12',
    muted: 'text-[#312D58]',
    iconHover: 'hover:bg-white/40',
    pinActive: 'bg-[#263F79] text-white',
  },
};

const PALETTE_ORDER: PastelVariant[] = ['yellow', 'pink', 'blue', 'lavender'];

export function getNotePastelVariant(noteId: string, index: number): PastelVariant {
  if (!noteId) return PALETTE_ORDER[index % PALETTE_ORDER.length];
  let hash = 0;
  for (let i = 0; i < noteId.length; i++) {
    hash = (hash * 31 + noteId.charCodeAt(i)) >>> 0;
  }
  return PALETTE_ORDER[hash % PALETTE_ORDER.length];
}

interface NoteCardProps {
  note: Note;
  variant: PastelVariant;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export function NoteCard({
  note,
  variant,
  onOpen,
  onTogglePin,
  onRequestDelete,
}: NoteCardProps) {
  const styles = VARIANT_CLASSES[variant];
  const displayTitle = note.title.trim() || 'Untitled Note';
  const displayContent = note.content.trim() || 'No content yet — click to add notes.';

  return (
    <article
      className={`${styles.card} flex min-h-[228px] flex-col justify-between rounded-2xl p-6 text-[#242424] shadow-[0_6px_18px_-8px_rgba(36,36,36,0.12)] transition-shadow duration-200 hover:shadow-[0_14px_28px_-10px_rgba(36,36,36,0.18)]`}
    >
      <div>
        {/* Top Row: Creation Date & Pin/Edit/Delete Actions */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium tabular-nums ${styles.muted}`}>
            {formatCreationDate(note.createdAt)}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onTogglePin(note)}
              aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] ${
                note.isPinned
                  ? styles.pinActive
                  : `${styles.muted} ${styles.iconHover} hover:text-[#242424]`
              }`}
            >
              <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onOpen(note)}
              aria-label="Edit note"
              title="Edit note"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263F79] ${styles.muted} ${styles.iconHover} hover:text-[#242424]`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(note)}
              aria-label="Delete note"
              title="Delete note"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${styles.muted} ${styles.iconHover} hover:text-[#B91C1C]`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Content Preview */}
        <button
          type="button"
          onClick={() => onOpen(note)}
          className="mt-3 block w-full text-left focus-visible:outline-none"
        >
          <h3 className="font-display line-clamp-1 text-lg font-bold tracking-tight text-[#242424]">
            {displayTitle}
          </h3>
          <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-[#242424]/85">
            {displayContent}
          </p>
        </button>
      </div>

      {/* Bottom Row: Last Updated Time */}
      <div className={`mt-5 flex items-center justify-between border-t pt-3 text-xs ${styles.divider} ${styles.muted}`}>
        <span className="inline-flex items-center gap-1.5 tabular-nums font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated {formatTimeOnly(note.updatedAt)}</span>
        </span>
        {note.isPinned && (
          <span className="font-semibold text-[#263F79]">Pinned</span>
        )}
      </div>
    </article>
  );
}
