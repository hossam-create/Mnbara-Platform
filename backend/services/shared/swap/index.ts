/**
 * Swap Module
 * 
 * Exports all swap-related types and services for peer-to-peer swap functionality.
 */

// Types
export {
  SwapStatus,
  SwapItemType,
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS,
  CreateSwapProposalInput,
  SwapItemInput,
  SwapMatchResult,
  ListingForMatching,
  SwapResponse,
  SwapItemResponse,
  SwapActionResult
} from './swap.types';

// Services
export { SwapService } from './swap.service';
export { SwapMatchingService } from './swap-matching.service';

// Default export
export { default } from './swap.service';
