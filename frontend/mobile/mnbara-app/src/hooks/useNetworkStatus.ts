/**
 * useNetworkStatus Hook
 * Monitors network connectivity and provides offline queue status
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribeToNetworkStatus, getOfflineQueue } from '../services/api';

interface NetworkStatus {
  isOnline: boolean;
  queuedRequestsCount: number;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    queuedRequestsCount: 0,
  });

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = subscribeToNetworkStatus((isOnline) => {
      setStatus((prev) => ({
        ...prev,
        isOnline,
        queuedRequestsCount: getOfflineQueue().getQueueSize(),
      }));
    });

    // Get initial status
    const queue = getOfflineQueue();
    setStatus({
      isOnline: queue.getIsOnline(),
      queuedRequestsCount: queue.getQueueSize(),
    });

    return unsubscribe;
  }, []);

  /**
   * Manually refresh queue count
   */
  const refreshQueueCount = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      queuedRequestsCount: getOfflineQueue().getQueueSize(),
    }));
  }, []);

  /**
   * Clear all queued requests
   */
  const clearQueue = useCallback(async () => {
    await getOfflineQueue().clearQueue();
    refreshQueueCount();
  }, [refreshQueueCount]);

  /**
   * Process queued requests manually
   */
  const processQueue = useCallback(async () => {
    await getOfflineQueue().processQueue();
    refreshQueueCount();
  }, [refreshQueueCount]);

  return {
    ...status,
    refreshQueueCount,
    clearQueue,
    processQueue,
  };
}

export default useNetworkStatus;
