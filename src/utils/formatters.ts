import type { Timestamp } from 'firebase/firestore';
import type { TimeframeFilter } from '../types/note';

export function formatRelativeDate(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') {
    return 'Just now';
  }
  const date = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatCreationDate(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') {
    return 'Today';
  }
  return ts.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeOnly(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') {
    return 'Just now';
  }
  return ts.toDate().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFullDateTime(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') {
    return 'Pending server timestamp';
  }
  const date = ts.toDate();
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function isDateInTimeframe(
  ts: Timestamp | null,
  timeframe: TimeframeFilter,
  referenceDate: Date
): boolean {
  if (timeframe === 'all') return true;
  const date = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date();

  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (timeframe === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  if (timeframe === 'week') {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  // month
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function formatDateRangeLabel(
  timeframe: TimeframeFilter,
  referenceDate: Date
): string {
  if (timeframe === 'today') {
    return referenceDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (timeframe === 'week') {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }
  return referenceDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function stepReferenceDate(
  current: Date,
  timeframe: TimeframeFilter,
  direction: -1 | 1
): Date {
  const next = new Date(current);
  if (timeframe === 'today') {
    next.setDate(next.getDate() + direction);
  } else if (timeframe === 'week') {
    next.setDate(next.getDate() + direction * 7);
  } else {
    next.setMonth(next.getMonth() + direction);
  }
  return next;
}
