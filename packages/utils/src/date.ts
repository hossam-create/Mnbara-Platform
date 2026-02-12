/**
 * Date formatting utilities
 */

export type DateFormat = 'iso' | 'iso-full' | 'short' | 'medium' | 'long' | 'full' | 'time' | 'date-time' | 'relative' | 'calendar';

export type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export function formatDate(date: Date | string | number, format: DateFormat = 'medium', locale: string = 'en-US'): string {
  const d = new Date(date);
  switch (format) {
    case 'iso': return d.toISOString().split('T')[0];
    case 'iso-full': return d.toISOString();
    case 'short': return d.toLocaleDateString(locale, { month: 'numeric', day: 'numeric', year: '2-digit' });
    case 'medium': return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long': return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    case 'full': return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'time': return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    case 'date-time': return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    case 'relative': return formatRelativeTime(d);
    case 'calendar': return formatCalendarDate(d, locale);
    default: return d.toLocaleDateString(locale);
  }
}

export function formatRelativeTime(date: Date | string | number, now?: Date): string {
  const d = new Date(date);
  const current = now || new Date();
  const diffMs = d.getTime() - current.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  
  if (absSeconds < 60) {
    return diffSeconds === 0 ? 'just now' : diffSeconds > 0 ? `in ${absSeconds}s` : `${absSeconds}s ago`;
  }
  
  const diffMinutes = Math.round(diffSeconds / 60);
  const absMinutes = Math.abs(diffMinutes);
  if (absMinutes < 60) {
    return diffMinutes > 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  }
  
  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours > 0 ? `in ${absHours}h` : `${absHours}h ago`;
  }
  
  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  if (absDays < 7) {
    return diffDays > 0 ? `in ${absDays}d` : `${absDays}d ago`;
  }
  
  const diffMonths = Math.round(diffDays / 30);
  const absMonths = Math.abs(diffMonths);
  if (absMonths < 12) {
    return diffMonths > 0 ? `in ${absMonths}mo` : `${absMonths}mo ago`;
  }
  
  const diffYears = Math.round(diffDays / 365);
  return diffYears > 0 ? `in ${diffYears}y` : `${diffYears}y ago`;
}

export function formatCalendarDate(date: Date | string | number, locale: string = 'en-US'): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return formatDate(d, 'medium', locale);
}

export function getStartOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getStartOfMonth(date: Date | string | number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfMonth(date: Date | string | number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export function isPast(date: Date | string | number): boolean {
  return new Date(date) < new Date();
}

export function isFuture(date: Date | string | number): boolean {
  return new Date(date) > new Date();
}
