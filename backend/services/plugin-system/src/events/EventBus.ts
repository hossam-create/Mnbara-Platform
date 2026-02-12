// ============================================================
// Event Bus - Redis-based event system for plugins
// ============================================================

import Redis from 'ioredis';
import { EventBus as IEventBus, EventDefinition } from '../types/plugin.types';
import { Logger } from '../utils/logger';

export class EventBus implements IEventBus {
  private redis: Redis;
  private logger: Logger;
  private localHandlers: Map<string, Function[]> = new Map();
  private subscriber: Redis;

  constructor(redisUrl: string, logger: Logger) {
    this.redis = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.logger = logger;

    // Subscribe to all events
    this.subscriber.psubscribe('plugin:event:*');

    // Handle incoming events
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const event: EventDefinition = JSON.parse(message);
        this.handleLocalEvent(event);
      } catch (error: any) {
        this.logger.error('Failed to parse event message', error);
      }
    });
  }

  /**
   * Emit an event
   */
  emit(eventName: string, data: any): void {
    const event: EventDefinition = {
      name: eventName,
      data,
      timestamp: new Date()
    };

    // Publish to Redis
    this.redis.publish(`plugin:event:${eventName}`, JSON.stringify(event))
      .catch(error => {
        this.logger.error(`Failed to publish event: ${eventName}`, error);
      });

    // Also handle locally
    this.handleLocalEvent(event);
  }

  /**
   * Subscribe to an event
   */
  on(eventName: string, handler: Function): void {
    if (!this.localHandlers.has(eventName)) {
      this.localHandlers.set(eventName, []);
    }

    this.localHandlers.get(eventName)!.push(handler);

    this.logger.debug(`Event handler registered: ${eventName}`);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName: string, handler: Function): void {
    const handlers = this.localHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.logger.debug(`Event handler unregistered: ${eventName}`);
      }
    }
  }

  /**
   * Handle local event
   */
  private handleLocalEvent(event: EventDefinition): void {
    const handlers = this.localHandlers.get(event.name);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event.data, event);
        } catch (error: any) {
          this.logger.error(`Event handler error: ${event.name}`, error);
        }
      }
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
    await this.subscriber.quit();
    this.logger.info('Event bus connections closed');
  }
}

