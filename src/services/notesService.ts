import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import type { Note, NoteInput } from '../types/note';

// Limits synchronized verbatim with firebase-blueprint.json & firestore.rules
export const NOTE_TITLE_MAX_LENGTH = 200;
export const NOTE_CONTENT_MAX_LENGTH = 50000;
export const DISPLAY_NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

function sanitizeNotePayload(input: NoteInput): NoteInput {
  return {
    title: input.title.slice(0, NOTE_TITLE_MAX_LENGTH),
    content: input.content.slice(0, NOTE_CONTENT_MAX_LENGTH),
    isPinned: Boolean(input.isPinned),
  };
}

export async function syncUserProfile(user: User, preferredName?: string): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  const safeEmail = (user.email || `${user.uid}@cloudnote.app`).slice(0, EMAIL_MAX_LENGTH);
  const rawName =
    preferredName?.trim() ||
    user.displayName?.trim() ||
    safeEmail.split('@')[0] ||
    'CloudNote User';
  const safeDisplayName = rawName.slice(0, DISPLAY_NAME_MAX_LENGTH);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: safeDisplayName,
        email: safeEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existing = snap.data();
      if (existing.displayName !== safeDisplayName || existing.email !== safeEmail) {
        await updateDoc(userRef, {
          displayName: safeDisplayName,
          email: safeEmail,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeToNotes(
  userId: string,
  onData: (notes: Note[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const notesPath = `users/${userId}/notes`;
  const notesRef = collection(db, 'users', userId, 'notes');
  const notesQuery = query(notesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      const items: Note[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: typeof data.title === 'string' ? data.title : '',
          content: typeof data.content === 'string' ? data.content : '',
          isPinned: Boolean(data.isPinned),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, notesPath);
      } catch (wrappedError) {
        onError(
          wrappedError instanceof Error ? wrappedError : new Error('Failed to load notes.')
        );
      }
    }
  );
}

export async function createNote(userId: string, input: NoteInput): Promise<string> {
  const notesPath = `users/${userId}/notes`;
  const notesRef = collection(db, 'users', userId, 'notes');
  const sanitized = sanitizeNotePayload(input);

  try {
    const docRef = await addDoc(notesRef, {
      title: sanitized.title,
      content: sanitized.content,
      isPinned: sanitized.isPinned,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, notesPath);
  }
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: Pick<NoteInput, 'title' | 'content'>
): Promise<void> {
  const notePath = `users/${userId}/notes/${noteId}`;
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  try {
    await updateDoc(noteRef, {
      title: input.title.slice(0, NOTE_TITLE_MAX_LENGTH),
      content: input.content.slice(0, NOTE_CONTENT_MAX_LENGTH),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notePath);
  }
}

export async function toggleNotePin(
  userId: string,
  noteId: string,
  isPinned: boolean
): Promise<void> {
  const notePath = `users/${userId}/notes/${noteId}`;
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  try {
    await updateDoc(noteRef, {
      isPinned: Boolean(isPinned),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notePath);
  }
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const notePath = `users/${userId}/notes/${noteId}`;
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  try {
    await deleteDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, notePath);
  }
}
