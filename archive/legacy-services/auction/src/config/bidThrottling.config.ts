import { BidThrottlingConfig } from '../types/BidThrottling.types';

/**
 * Bid Throttling Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All thresholds configurable for different deployment environments
 */
export const bidThrottlingConfig: BidThrottlingConfig = {
  // Rate limits per user
  maxBidsPerMinutePerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_USER || '3'),
  maxBidsPerHourPerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_USER || '30'),
  maxBidsPerAuctionPerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_AUCTION_PER_USER || '10'),
  
  // Rate limits per auction
  maxBidsPerMinutePerAuction: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_AUCTION || '10'),
  maxBidsPerHourPerAuction: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_AUCTION || '100'),
  
  // IP-based limits (secondary signal)
  maxBidsPerMinutePerIP: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_IP || '5'),
  maxBidsPerHourPerIP: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_IP || '50'),
  
  // Temporary block duration
  tempBlockDurationMinutes: parseInt(process.env.BID_THROTTLE_TEMP_BLOCK_MINUTES || '5'),
  
  // Flag thresholds
  flagThresholdConsecutiveBlocks: parseInt(process.env.BID_THROTTLE_FLAG_CONSECUTIVE_BLOCKS || '3'),
  flagThresholdHighFrequency: parseInt(process.env.BID_THROTTLE_FLAG_HIGH_FREQUENCY || '20')
};

/**
 * Reload configuration from environment variables
 * Call this to update thresholds without restart
 */
export function reloadBidThrottlingConfig(): void {
  const newConfig: BidThrottlingConfig = {
    maxBidsPerMinutePerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_USER || '3'),
    maxBidsPerHourPerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_USER || '30'),
    maxBidsPerAuctionPerUser: parseInt(process.env.BID_THROTTLE_MAX_PER_AUCTION_PER_USER || '10'),
    maxBidsPerMinutePerAuction: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_AUCTION || '10'),
    maxBidsPerHourPerAuction: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_AUCTION || '100'),
    maxBidsPerMinutePerIP: parseInt(process.env.BID_THROTTLE_MAX_PER_MINUTE_PER_IP || '5'),
    maxBidsPerHourPerIP: parseInt(process.env.BID_THROTTLE_MAX_PER_HOUR_PER_IP || '50'),
    tempBlockDurationMinutes: parseInt(process.env.BID_THROTTLE_TEMP_BLOCK_MINUTES || '5'),
    flagThresholdConsecutiveBlocks: parseInt(process.env.BID_THROTTLE_FLAG_CONSECUTIVE_BLOCKS || '3'),
    flagThresholdHighFrequency: parseInt(process.env.BID_THROTTLE_FLAG_HIGH_FREQUENCY || '20')
  };
  
  // Update config object
  Object.assign(bidThrottlingConfig, newConfig);
  
  console.log('[BidThrottling] Configuration reloaded:', newConfig);
}

/**
 * Validate configuration values
 */
export function validateBidThrottlingConfig(): boolean {
  const config = bidThrottlingConfig;
  
  if (config.maxBidsPerMinutePerUser < 1) {
    console.error('[BidThrottling] Invalid maxBidsPerMinutePerUser:', config.maxBidsPerMinutePerUser);
    return false;
  }
  
  if (config.maxBidsPerHourPerUser < config.maxBidsPerMinutePerUser) {
    console.error('[BidThrottling] maxBidsPerHourPerUser must be >= maxBidsPerMinutePerUser');
    return false;
  }
  
  if (config.tempBlockDurationMinutes < 1) {
    console.error('[BidThrottling] Invalid tempBlockDurationMinutes:', config.tempBlockDurationMinutes);
    return false;
  }
  
  if (config.flagThresholdConsecutiveBlocks < 1) {
    console.error('[BidThrottling] Invalid flagThresholdConsecutiveBlocks:', config.flagThresholdConsecutiveBlocks);
    return false;
  }
  
  return true;
}

// Validate configuration on startup
if (!validateBidThrottlingConfig()) {
  throw new Error('[BidThrottling] Invalid configuration detected');
}
