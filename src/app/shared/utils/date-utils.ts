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

/**
 * Formats elapsed time into localized Arabic units:
 * دقائق، ساعات، أيام، أسابيع، أشهر، سنين.
 */
export function formatElapsedTime(val: string | Date | null | undefined, baseDate?: Date): string {
  if (!val) return '';
  const now = (baseDate ?? new Date()).getTime();
  const created = parseUtcDate(val).getTime();
  const diffSec = Math.max(0, Math.floor((now - created) / 1000));

  if (diffSec < 60) {
    return 'الآن (<1 د)';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} دقيقة`;
  }

  const diffHours = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffHours < 24) {
    return remMin > 0 ? `${diffHours}س ${remMin}د` : `${diffHours} ساعة`;
  }

  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  if (diffDays < 7) {
    if (diffDays === 1) {
      return remHours > 0 ? `منذ يوم و${remHours}س` : `منذ يوم`;
    }
    if (diffDays === 2) {
      return remHours > 0 ? `منذ يومين و${remHours}س` : `منذ يومين`;
    }
    return `منذ ${diffDays} أيام`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffDays < 30) {
    if (diffWeeks === 1) return 'منذ أسبوع';
    if (diffWeeks === 2) return 'منذ أسبوعين';
    return `منذ ${diffWeeks} أسابيع`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffDays < 365) {
    if (diffMonths === 1) return 'منذ شهر';
    if (diffMonths === 2) return 'منذ شهرين';
    if (diffMonths >= 3 && diffMonths <= 10) return `منذ ${diffMonths} أشهر`;
    return `منذ ${diffMonths} شهر`;
  }

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return 'منذ سنة';
  if (diffYears === 2) return 'منذ سنتين';
  return `منذ ${diffYears} سنوات`;
}
