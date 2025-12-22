/**
 * Offline Request Queue for MNBARA Mobile App
 * Queues failed requests when offline and retries when connection is restored
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@mnbara_offline_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

type RequestExecutor = (request: QueuedRequest) => Promise<unknown>;

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline = true;
  private isProcessing = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private requestExecutor: RequestExecutor | null = null;

  constructor() {
    this.initNetworkListener();
    this.loadQueue();
  }

  /**
   * Initialize network state listener
   */
  private initNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach((listener) => listener(this.isOnline));

      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Set the request executor function
   */
  setRequestExecutor(executor: RequestExecutor) {
    this.requestExecutor = executor;
  }

  /**
   * Check if device is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isOnline);
    return () => this.listeners.delete(listener);
  }

  /**
   * Add a request to the queue
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Enforce max queue size (remove oldest low-priority items)
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      const lowPriorityIndex = this.queue.findIndex((r) => r.priority === 'low');
      if (lowPriorityIndex !== -1) {
        this.queue.splice(lowPriorityIndex, 1);
      } else {
        this.queue.shift(); // Remove oldest
      }
    }

    // Insert based on priority
    if (request.priority === 'high') {
      this.queue.unshift(queuedRequest);
    } else {
      this.queue.push(queuedRequest);
    }

    await this.saveQueue();
    return queuedRequest.id;
  }

  /**
   * Remove a request from the queue
   */
  async dequeue(id: string): Promise<void> {
    this.queue = this.queue.filter((r) => r.id !== id);
    await this.saveQueue();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Clear the entire queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.isProcessing || !this.requestExecutor) {
      return;
    }

    this.isProcessing = true;

    try {
      const requestsToProcess = [...this.queue];

      for (const request of requestsToProcess) {
        if (!this.isOnline) {
          break; // Stop if we go offline
        }

        try {
          await this.requestExecutor(request);
          await this.dequeue(request.id);
        } catch (error) {
          // Increment retry count
          request.retryCount++;

          if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
            // Remove after max retries
            await this.dequeue(request.id);
            console.warn(`Request ${request.id} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
          } else {
            // Update retry count in queue
            const index = this.queue.findIndex((r) => r.id === request.id);
            if (index !== -1) {
              this.queue[index] = request;
              await this.saveQueue();
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if a request should be queued (for non-GET requests when offline)
   */
  shouldQueue(method: string): boolean {
    return !this.isOnline && method !== 'GET';
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

export default offlineQueue;
