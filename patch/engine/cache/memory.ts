/**
 * Memory Cache (L1)
 *
 * Fast in-memory cache using Map with LRU eviction.
 */

import type { CachedAnalysis } from './types';

export class MemoryCache {
  private cache: Map<string, CachedAnalysis>;
  private accessOrder: string[]; // Track access order for LRU
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;

    console.log(`[CACHE MEMORY] Initialized with max size: ${maxSize}`);
  }

  /**
   * Get cached analysis
   */
  get(key: string): CachedAnalysis | null {
    const value = this.cache.get(key);

    if (value) {
      // Update access order (move to end = most recently used)
      this.updateAccessOrder(key);
      return value;
    }

    return null;
  }

  /**
   * Store analysis in cache
   */
  set(key: string, value: CachedAnalysis): void {
    // Check if we need to evict
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, value);
    this.updateAccessOrder(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    console.log(`[CACHE MEMORY] Cleared ${previousSize} entries`);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    // Remove existing entry
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used entry
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[CACHE MEMORY] Evicted LRU entry: ${oldestKey.slice(0, 50)}...`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; utilizationPercent: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100,
    };
  }
}
