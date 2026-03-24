/**
 * Unit tests for date utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  formatCalendarDate,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  formatDuration,
  isToday,
  isPast,
  isFuture,
  addDays,
  addMonths,
  addYears,
  diffInDays,
  diffInHours,
  diffInMinutes,
  isWeekend,
  isWeekday,
  getWeekNumber,
  parseDate,
  isValidDate,
} from '../date';

describe('date utilities', () => {
  const testDate = new Date('2024-03-15T12:30:00Z');

  describe('formatDate', () => {
    it('should format as ISO date', () => {
      const result = formatDate(testDate, 'iso');
      expect(result).toBe('2024-03-15');
    });

    it('should format as ISO full', () => {
      const result = formatDate(testDate, 'iso-full');
      expect(result).toContain('2024-03-15');
      expect(result).toContain('T');
    });

    it('should format as medium', () => {
      const result = formatDate(testDate, 'medium');
      expect(result).toContain('Mar');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format as time', () => {
      const result = formatDate(testDate, 'time');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle string input', () => {
      const result = formatDate('2024-03-15', 'iso');
      expect(result).toBe('2024-03-15');
    });

    it('should handle timestamp input', () => {
      const result = formatDate(testDate.getTime(), 'iso');
      expect(result).toBe('2024-03-15');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format seconds ago', () => {
      const now = new Date('2024-03-15T12:30:30Z');
      const past = new Date('2024-03-15T12:30:00Z');
      const result = formatRelativeTime(past, now);
      expect(result).toBe('30s ago');
    });

    it('should format minutes ago', () => {
      const now = new Date('2024-03-15T12:35:00Z');
      const past = new Date('2024-03-15T12:30:00Z');
      const result = formatRelativeTime(past, now);
      expect(result).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const now = new Date('2024-03-15T15:30:00Z');
      const past = new Date('2024-03-15T12:30:00Z');
      const result = formatRelativeTime(past, now);
      expect(result).toBe('3h ago');
    });

    it('should format days ago', () => {
      const now = new Date('2024-03-18T12:30:00Z');
      const past = new Date('2024-03-15T12:30:00Z');
      const result = formatRelativeTime(past, now);
      expect(result).toBe('3d ago');
    });

    it('should format future time', () => {
      const now = new Date('2024-03-15T12:30:00Z');
      const future = new Date('2024-03-15T12:35:00Z');
      const result = formatRelativeTime(future, now);
      expect(result).toBe('in 5m');
    });

    it('should handle just now', () => {
      const now = new Date('2024-03-15T12:30:00Z');
      const result = formatRelativeTime(now, now);
      expect(result).toBe('just now');
    });
  });

  describe('formatCalendarDate', () => {
    it('should return "Today" for today', () => {
      const now = new Date();
      const result = formatCalendarDate(now);
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatCalendarDate(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('should return "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatCalendarDate(tomorrow);
      expect(result).toBe('Tomorrow');
    });

    it('should return formatted date for other days', () => {
      const otherDay = new Date('2024-01-01');
      const result = formatCalendarDate(otherDay);
      expect(result).toContain('Jan');
      expect(result).toContain('1');
      expect(result).toContain('2024');
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const result = getStartOfDay(testDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day', () => {
      const result = getEndOfDay(testDate);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('getStartOfMonth', () => {
    it('should return start of month', () => {
      const result = getStartOfMonth(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('getEndOfMonth', () => {
    it('should return end of month', () => {
      const result = getEndOfMonth(testDate);
      expect(result.getDate()).toBe(31); // March has 31 days
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3665000)).toBe('1h 1m');
    });

    it('should format days and hours', () => {
      expect(formatDuration(90000000)).toBe('1d 1h');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past date', () => {
      const past = new Date('2020-01-01');
      expect(isPast(past)).toBe(true);
    });

    it('should return false for future date', () => {
      const future = new Date('2030-01-01');
      expect(isPast(future)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const future = new Date('2030-01-01');
      expect(isFuture(future)).toBe(true);
    });

    it('should return false for past date', () => {
      const past = new Date('2020-01-01');
      expect(isFuture(past)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const result = addDays(testDate, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should subtract days with negative value', () => {
      const result = addDays(testDate, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      const result = addMonths(testDate, 2);
      expect(result.getMonth()).toBe(4); // May (0-indexed)
    });

    it('should subtract months with negative value', () => {
      const result = addMonths(testDate, -2);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('addYears', () => {
    it('should add years correctly', () => {
      const result = addYears(testDate, 2);
      expect(result.getFullYear()).toBe(2026);
    });

    it('should subtract years with negative value', () => {
      const result = addYears(testDate, -2);
      expect(result.getFullYear()).toBe(2022);
    });
  });

  describe('diffInDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-03-15');
      const date2 = new Date('2024-03-20');
      expect(diffInDays(date1, date2)).toBe(5);
    });

    it('should handle negative difference', () => {
      const date1 = new Date('2024-03-20');
      const date2 = new Date('2024-03-15');
      expect(diffInDays(date1, date2)).toBe(-5);
    });
  });

  describe('diffInHours', () => {
    it('should calculate difference in hours', () => {
      const date1 = new Date('2024-03-15T12:00:00');
      const date2 = new Date('2024-03-15T15:00:00');
      expect(diffInHours(date1, date2)).toBe(3);
    });
  });

  describe('diffInMinutes', () => {
    it('should calculate difference in minutes', () => {
      const date1 = new Date('2024-03-15T12:00:00');
      const date2 = new Date('2024-03-15T12:30:00');
      expect(diffInMinutes(date1, date2)).toBe(30);
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-03-16'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-03-17'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekday', () => {
      const monday = new Date('2024-03-18'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe('isWeekday', () => {
    it('should return true for weekday', () => {
      const monday = new Date('2024-03-18'); // Monday
      expect(isWeekday(monday)).toBe(true);
    });

    it('should return false for weekend', () => {
      const saturday = new Date('2024-03-16'); // Saturday
      expect(isWeekday(saturday)).toBe(false);
    });
  });

  describe('getWeekNumber', () => {
    it('should return correct week number', () => {
      const date = new Date('2024-01-15');
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBeGreaterThan(0);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-03-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should return null for invalid date', () => {
      const result = parseDate('invalid-date');
      expect(result).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date', () => {
      const date = new Date('2024-03-15');
      expect(isValidDate(date)).toBe(true);
    });

    it('should return false for invalid date', () => {
      const date = new Date('invalid');
      expect(isValidDate(date)).toBe(false);
    });

    it('should return false for non-date', () => {
      expect(isValidDate('not a date')).toBe(false);
    });
  });
});
