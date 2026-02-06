import { PostHog } from 'posthog-node';
import { logger } from '../utils/logger';

export interface PostHogEventInput {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface PostHogIdentifyInput {
  distinctId: string;
  properties: Record<string, any>;
}

export class PostHogService {
  private client: PostHog;

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (!apiKey) {
      throw new Error('POSTHOG_API_KEY is required');
    }

    this.client = new PostHog(apiKey, { host });
  }

  // Capture event
  async captureEvent(input: PostHogEventInput) {
    try {
      this.client.capture({
        distinctId: input.distinctId,
        event: input.event,
        properties: input.properties,
        timestamp: input.timestamp
      });

      logger.info(`PostHog event captured: ${input.event} for ${input.distinctId}`);
    } catch (error) {
      logger.error('PostHog capture error:', error);
      throw error;
    }
  }

  // Identify user
  async identify(input: PostHogIdentifyInput) {
    try {
      this.client.identify({
        distinctId: input.distinctId,
        properties: input.properties
      });

      logger.info(`PostHog user identified: ${input.distinctId}`);
    } catch (error) {
      logger.error('PostHog identify error:', error);
      throw error;
    }
  }

  // Create alias
  async alias(distinctId: string, alias: string) {
    try {
      this.client.alias({
        distinctId,
        alias
      });

      logger.info(`PostHog alias created: ${distinctId} -> ${alias}`);
    } catch (error) {
      logger.error('PostHog alias error:', error);
      throw error;
    }
  }

  // Group analytics
  async groupIdentify(groupType: string, groupKey: string, properties: Record<string, any>) {
    try {
      this.client.groupIdentify({
        groupType,
        groupKey,
        properties
      });

      logger.info(`PostHog group identified: ${groupType}:${groupKey}`);
    } catch (error) {
      logger.error('PostHog group identify error:', error);
      throw error;
    }
  }

  // Feature flags
  async isFeatureEnabled(key: string, distinctId: string): Promise<boolean> {
    try {
      const enabled = await this.client.isFeatureEnabled(key, distinctId);
      return enabled || false;
    } catch (error) {
      logger.error('PostHog feature flag error:', error);
      return false;
    }
  }

  async getFeatureFlag(key: string, distinctId: string): Promise<string | boolean | undefined> {
    try {
      return await this.client.getFeatureFlag(key, distinctId);
    } catch (error) {
      logger.error('PostHog get feature flag error:', error);
      return undefined;
    }
  }

  // Shutdown
  async shutdown() {
    await this.client.shutdown();
  }
}
