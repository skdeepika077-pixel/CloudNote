import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyAuthError(error: unknown): {
  message: string;
  isProviderDisabled?: boolean;
} {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return {
        message:
          'Email/Password sign-in is not yet enabled in this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method, or use Google Sign-In below.',
        isProviderDisabled: true,
      };
    case 'auth/email-already-in-use':
      return { message: 'An account with this email address already exists.' };
    case 'auth/invalid-email':
      return { message: 'Please enter a valid email address.' };
    case 'auth/weak-password':
      return { message: 'Password should be at least 6 characters long.' };
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return { message: 'Invalid email or password. Please check your credentials and try again.' };
    case 'auth/too-many-requests':
      return { message: 'Too many failed attempts. Please wait a moment before trying again.' };
    case 'auth/popup-closed-by-user':
      return { message: 'Google sign-in popup was closed before completing.' };
    case 'auth/network-request-failed':
      return { message: 'Network error. Please check your internet connection.' };
    default:
      return {
        message:
          error instanceof Error
            ? error.message.replace(/^Firebase:\s*/i, '')
            : 'Authentication failed. Please try again.',
      };
  }
}

export function getFriendlyFirestoreError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('Quota exceeded')) {
    return 'Firestore daily free-tier quota exceeded. Quota resets tomorrow.';
  }
  if (raw.includes('Missing or insufficient permissions') || raw.includes('permission-denied')) {
    return 'Permission denied by Firestore security rules. Please ensure you are signed in to your account.';
  }
  if (raw.includes('client is offline') || raw.includes('unavailable')) {
    return 'Unable to reach Cloud Firestore. Check your internet connection.';
  }
  return 'Could not complete the cloud database request. Please try again.';
}
