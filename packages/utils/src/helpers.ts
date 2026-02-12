/**
 * General utility helpers
 */

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

export function safeJsonStringify(value: unknown, fallback: string = ''): string {
  try { return JSON.stringify(value); } catch { return fallback; }
}

export function getNestedValue<T>(obj: Record<string, unknown>, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }
  return current as T;
}

export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], keyFn: (item: T) => number | string, order: 'asc' | 'desc' = 'asc'): T[] {
  const multiplier = order === 'asc' ? 1 : -1;
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
}

export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) return [...new Set(array)];
  const seen = new Set<unknown>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function flattenDeep<T>(array: unknown[]): T[] {
  return array.reduce<T[]>((acc, val) => {
    if (Array.isArray(val)) return acc.concat(flattenDeep<T>(val));
    acc.push(val as T);
    return acc;
  }, []);
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sample<T>(array: T[], count: number = 1): T[] {
  return shuffle(array).slice(0, count);
}

export function first<T>(array: T[], fallback?: T): T | undefined {
  return array[0] ?? fallback;
}

export function last<T>(array: T[], fallback?: T): T | undefined {
  return array[array.length - 1] ?? fallback;
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

export function intersect<T>(a: T[], b: T[]): T[] {
  return a.filter(val => b.includes(val));
}

export function union<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

export function difference<T>(a: T[], b: T[]): T[] {
  return a.filter(val => !b.includes(val));
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  array.forEach(item => predicate(item) ? pass.push(item) : fail.push(item));
  return [pass, fail];
}

export function countBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
  return array.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

export function sum<T>(array: T[], valueFn: (item: T) => number): number {
  return array.reduce((total, item) => total + valueFn(item), 0);
}

export function average<T>(array: T[], valueFn: (item: T) => number): number {
  if (array.length === 0) return 0;
  return sum(array, valueFn) / array.length;
}

export function min<T>(array: T[], valueFn: (item: T) => number): number {
  if (array.length === 0) return Infinity;
  return Math.min(...array.map(valueFn));
}

export function max<T>(array: T[], valueFn: (item: T) => number): number {
  if (array.length === 0) return -Infinity;
  return Math.max(...array.map(valueFn));
}

export function rangeNumber(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) result.push(i);
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function parseBytes(value: string): number {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB)?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const unitIndex = sizes.indexOf(unit);
  if (unitIndex === -1) return 0;
  return num * Math.pow(1024, unitIndex);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) await sleep(baseDelay * Math.pow(2, i));
    }
  }
  throw lastError;
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${random}`;
}
