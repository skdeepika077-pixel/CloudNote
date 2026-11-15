import { Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface NoteInput {
  title: string;
  content: string;
  isPinned: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type SidebarSection = 'notes' | 'calendar' | 'archive' | 'trash';

export type TimeframeFilter = 'all' | 'today' | 'week' | 'month';

export type CollectionFilter = 'all' | 'pinned' | 'recent';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}
