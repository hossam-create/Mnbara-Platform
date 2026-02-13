/**
 * eBay Live / Mnbarh Live – backend base URL
 * Set REACT_APP_LIVE_SERVICE_URL in .env (e.g. http://localhost:3000)
 */
export const LIVE_SERVICE_BASE_URL =
  process.env.REACT_APP_LIVE_SERVICE_URL || 'http://localhost:3000';

export const liveServiceApi = {
  streams: `${LIVE_SERVICE_BASE_URL}/api/streams`,
  streamById: (id: string) => `${LIVE_SERVICE_BASE_URL}/api/streams/${id}`,
  generateKey: `${LIVE_SERVICE_BASE_URL}/api/streams/generate-key`,
  stopStream: (streamKey: string) => `${LIVE_SERVICE_BASE_URL}/api/streams/${streamKey}/stop`,
  chat: (streamId: string) => `${LIVE_SERVICE_BASE_URL}/api/chat/${streamId}`,
  auctions: `${LIVE_SERVICE_BASE_URL}/api/auctions`,
  auctionById: (id: string) => `${LIVE_SERVICE_BASE_URL}/api/auctions/${id}`,
};
