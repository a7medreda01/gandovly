/**
 * Safely parses a date string from the backend into a Date object.
 * Because backend stores timestamps in UTC, any ISO string lacking timezone info
 * (e.g. "2026-10-09T22:15:00") is treated as UTC by appending 'Z'
 * so that the browser does not interpret it as local time and shift it by hours.
 */
export function parseUtcDate(val: string | Date | null | undefined): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return new Date();
    // If it has no 'Z' and no timezone offset like +02:00 or -05:00, append 'Z'
    if (!trimmed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
      return new Date(trimmed + 'Z');
    }
    return new Date(trimmed);
  }
  return new Date(val);
}

/**
 * Formats a UTC date string into Egypt local time (e.g. "01:15 ص").
 */
export function formatEgyptTime(val: string | Date | null | undefined): string {
  if (!val) return '';
  try {
    const d = parseUtcDate(val);
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(val);
  }
}

/**
 * Formats a date into a localized Egyptian date and time (e.g. "السبت، 10 أكتوبر - 01:15 ص").
 */
export function formatEgyptDateTime(val: string | Date | null | undefined): string {
  if (!val) return '';
  try {
    const d = parseUtcDate(val);
    return d.toLocaleDateString('ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(val);
  }
}
