import { randomUUID } from 'crypto';

export class CorrelationContext {
  private static storage = new Map<string, string>();

  static set(correlationId: string): void {
    const asyncId = this.getAsyncId();
    this.storage.set(asyncId, correlationId);
  }

  static get(): string | undefined {
    const asyncId = this.getAsyncId();
    return this.storage.get(asyncId);
  }

  static getOrCreate(): string {
    const existing = this.get();
    if (existing) {
      return existing;
    }
    const newId = randomUUID();
    this.set(newId);
    return newId;
  }

  static clear(): void {
    const asyncId = this.getAsyncId();
    this.storage.delete(asyncId);
  }

  private static getAsyncId(): string {
    return `async-${Date.now()}-${Math.random()}`;
  }
}

export function generateCorrelationId(): string {
  return randomUUID();
}

export function withCorrelationId<T>(
  correlationId: string | undefined,
  fn: () => T
): T {
  const id = correlationId || generateCorrelationId();
  CorrelationContext.set(id);
  try {
    return fn();
  } finally {
    CorrelationContext.clear();
  }
}

export async function withCorrelationIdAsync<T>(
  correlationId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const id = correlationId || generateCorrelationId();
  CorrelationContext.set(id);
  try {
    return await fn();
  } finally {
    CorrelationContext.clear();
  }
}
