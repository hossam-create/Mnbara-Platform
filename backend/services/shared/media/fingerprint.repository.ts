/**
 * Fingerprint Repository
 * 
 * Handles storage and retrieval of image fingerprints for
 * duplicate detection and watermark verification.
 */

import { ImageFingerprint } from './watermark.service';

export interface FingerprintQuery {
  uploaderId?: string;
  hash?: string;
  perceptualHash?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface FingerprintSearchResult {
  fingerprints: ImageFingerprint[];
  total: number;
  hasMore: boolean;
}

/**
 * In-memory fingerprint store for development
 * In production, use PostgreSQL or Redis
 */
class InMemoryFingerprintStore {
  private fingerprints: Map<string, ImageFingerprint> = new Map();
  private hashIndex: Map<string, string[]> = new Map();
  private perceptualHashIndex: Map<string, string[]> = new Map();

  async save(fingerprint: ImageFingerprint): Promise<void> {
    this.fingerprints.set(fingerprint.id, fingerprint);
    
    // Index by hash
    const hashIds = this.hashIndex.get(fingerprint.hash) || [];
    hashIds.push(fingerprint.id);
    this.hashIndex.set(fingerprint.hash, hashIds);
    
    // Index by perceptual hash
    const pHashIds = this.perceptualHashIndex.get(fingerprint.perceptualHash) || [];
    pHashIds.push(fingerprint.id);
    this.perceptualHashIndex.set(fingerprint.perceptualHash, pHashIds);
  }

  async findById(id: string): Promise<ImageFingerprint | null> {
    return this.fingerprints.get(id) || null;
  }

  async findByHash(hash: string): Promise<ImageFingerprint[]> {
    const ids = this.hashIndex.get(hash) || [];
    return ids.map(id => this.fingerprints.get(id)!).filter(Boolean);
  }

  async findByPerceptualHash(perceptualHash: string): Promise<ImageFingerprint[]> {
    const ids = this.perceptualHashIndex.get(perceptualHash) || [];
    return ids.map(id => this.fingerprints.get(id)!).filter(Boolean);
  }

  async search(query: FingerprintQuery): Promise<FingerprintSearchResult> {
    let results = Array.from(this.fingerprints.values());
    
    if (query.uploaderId) {
      results = results.filter(f => f.metadata.uploaderId === query.uploaderId);
    }
    
    if (query.hash) {
      results = results.filter(f => f.hash === query.hash);
    }
    
    if (query.perceptualHash) {
      results = results.filter(f => f.perceptualHash === query.perceptualHash);
    }
    
    if (query.dateFrom) {
      results = results.filter(f => new Date(f.createdAt) >= query.dateFrom!);
    }
    
    if (query.dateTo) {
      results = results.filter(f => new Date(f.createdAt) <= query.dateTo!);
    }
    
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    results = results.slice(offset, offset + limit);
    
    return {
      fingerprints: results,
      total,
      hasMore: offset + results.length < total,
    };
  }

  async getAllPerceptualHashes(): Promise<string[]> {
    return Array.from(this.perceptualHashIndex.keys());
  }

  async delete(id: string): Promise<boolean> {
    const fingerprint = this.fingerprints.get(id);
    if (!fingerprint) return false;
    
    this.fingerprints.delete(id);
    
    // Remove from hash index
    const hashIds = this.hashIndex.get(fingerprint.hash) || [];
    this.hashIndex.set(fingerprint.hash, hashIds.filter(i => i !== id));
    
    // Remove from perceptual hash index
    const pHashIds = this.perceptualHashIndex.get(fingerprint.perceptualHash) || [];
    this.perceptualHashIndex.set(fingerprint.perceptualHash, pHashIds.filter(i => i !== id));
    
    return true;
  }

  async clear(): Promise<void> {
    this.fingerprints.clear();
    this.hashIndex.clear();
    this.perceptualHashIndex.clear();
  }
}

/**
 * FingerprintRepository - Main interface for fingerprint storage
 */
export class FingerprintRepository {
  private store: InMemoryFingerprintStore;

  constructor() {
    this.store = new InMemoryFingerprintStore();
  }

  /**
   * Save a new fingerprint
   */
  async save(fingerprint: ImageFingerprint): Promise<ImageFingerprint> {
    await this.store.save(fingerprint);
    return fingerprint;
  }

  /**
   * Find fingerprint by ID
   */
  async findById(id: string): Promise<ImageFingerprint | null> {
    return this.store.findById(id);
  }

  /**
   * Find fingerprints by exact hash match
   */
  async findByHash(hash: string): Promise<ImageFingerprint[]> {
    return this.store.findByHash(hash);
  }

  /**
   * Find fingerprints by perceptual hash
   */
  async findByPerceptualHash(perceptualHash: string): Promise<ImageFingerprint[]> {
    return this.store.findByPerceptualHash(perceptualHash);
  }

  /**
   * Search fingerprints with filters
   */
  async search(query: FingerprintQuery): Promise<FingerprintSearchResult> {
    return this.store.search(query);
  }

  /**
   * Get all perceptual hashes for duplicate detection
   */
  async getAllPerceptualHashes(): Promise<string[]> {
    return this.store.getAllPerceptualHashes();
  }

  /**
   * Check if an exact duplicate exists
   */
  async isDuplicate(hash: string): Promise<boolean> {
    const existing = await this.store.findByHash(hash);
    return existing.length > 0;
  }

  /**
   * Delete a fingerprint
   */
  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  /**
   * Get fingerprints by uploader
   */
  async findByUploader(uploaderId: string, limit = 100): Promise<ImageFingerprint[]> {
    const result = await this.store.search({ uploaderId, limit });
    return result.fingerprints;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalFingerprints: number;
    uniqueHashes: number;
    uniquePerceptualHashes: number;
  }> {
    const allHashes = await this.store.getAllPerceptualHashes();
    const result = await this.store.search({ limit: 1 });
    
    return {
      totalFingerprints: result.total,
      uniqueHashes: result.total, // Simplified
      uniquePerceptualHashes: allHashes.length,
    };
  }
}

// Export singleton instance
export const fingerprintRepository = new FingerprintRepository();
