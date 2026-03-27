/**
 * RabbitMQ Service for Trips Service
 * Handles event publishing for location updates and trip changes
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

interface RabbitMQConfig {
  url: string;
  exchanges: {
    location: string;
    trip: string;
    matching: string;
  };
}

interface LocationEvent {
  travelerId: number;
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  airportCode?: string;
  timestamp: string;
}

interface TripEvent {
  tripId: string;
  travelerId: string;
  eventType: 'created' | 'updated' | 'cancelled' | 'completed';
  data: any;
  timestamp: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private config: RabbitMQConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor() {
    this.config = {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchanges: {
        location: 'traveler.location',
        trip: 'traveler.trip',
        matching: 'traveler.matching',
      },
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      // Set up exchanges
      await this.setupExchanges();

      // Handle connection errors
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.handleConnectionError();
      });

      this.logger.log('Connected to RabbitMQ successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Set up exchanges
   */
  private async setupExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Location exchange (fanout - broadcast to all consumers)
    await this.channel.assertExchange(
      this.config.exchanges.location,
      'fanout',
      { durable: true }
    );

    // Trip exchange (topic - route by event type)
    await this.channel.assertExchange(
      this.config.exchanges.trip,
      'topic',
      { durable: true }
    );

    // Matching exchange (direct - specific routing)
    await this.channel.assertExchange(
      this.config.exchanges.matching,
      'direct',
      { durable: true }
    );

    this.logger.log('RabbitMQ exchanges set up successfully');
  }

  /**
   * Handle connection errors and reconnect
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(`Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      await this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from RabbitMQ
   */
  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  /**
   * Publish location update event
   */
  async publishLocationUpdate(location: LocationEvent): Promise<boolean> {
    try {
      if (!this.channel) {
        this.logger.warn('RabbitMQ channel not available, skipping event publish');
        return false;
      }

      const message = JSON.stringify({
        event: 'location.updated',
        data: location,
        timestamp: new Date().toISOString(),
      });

      const published = this.channel.publish(
        this.config.exchanges.location,
        '', // fanout doesn't use routing key
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
        }
      );

      if (published) {
        this.logger.debug(`Location event published for traveler ${location.travelerId}`);
      } else {
        this.logger.warn('Failed to publish location event (buffer full)');
      }

      return published;
    } catch (error) {
      this.logger.error('Error publishing location event:', error);
      return false;
    }
  }

  /**
   * Publish trip event
   */
  async publishTripEvent(trip: TripEvent): Promise<boolean> {
    try {
      if (!this.channel) {
        this.logger.warn('RabbitMQ channel not available, skipping event publish');
        return false;
      }

      const message = JSON.stringify({
        event: `trip.${trip.eventType}`,
        data: trip,
        timestamp: new Date().toISOString(),
      });

      const routingKey = `trip.${trip.eventType}`;

      const published = this.channel.publish(
        this.config.exchanges.trip,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
        }
      );

      if (published) {
        this.logger.debug(`Trip event published: ${routingKey}`);
      } else {
        this.logger.warn('Failed to publish trip event (buffer full)');
      }

      return published;
    } catch (error) {
      this.logger.error('Error publishing trip event:', error);
      return false;
    }
  }

  /**
   * Publish matching opportunity event
   */
  async publishMatchingOpportunity(data: {
    travelerId: string;
    requestId: string;
    distance: number;
    matchScore: number;
  }): Promise<boolean> {
    try {
      if (!this.channel) {
        this.logger.warn('RabbitMQ channel not available, skipping event publish');
        return false;
      }

      const message = JSON.stringify({
        event: 'matching.opportunity',
        data,
        timestamp: new Date().toISOString(),
      });

      const published = this.channel.publish(
        this.config.exchanges.matching,
        'opportunity',
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
        }
      );

      if (published) {
        this.logger.debug(`Matching opportunity published for traveler ${data.travelerId}`);
      } else {
        this.logger.warn('Failed to publish matching opportunity (buffer full)');
      }

      return published;
    } catch (error) {
      this.logger.error('Error publishing matching opportunity:', error);
      return false;
    }
  }

  /**
   * Check if RabbitMQ is connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    exchanges: string[];
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      exchanges: Object.values(this.config.exchanges),
    };
  }
}
