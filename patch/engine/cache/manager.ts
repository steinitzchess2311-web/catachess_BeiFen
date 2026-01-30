/**
 * Cache Manager
 *
 * Coordinates multi-layer caching (Memory → IndexedDB → Network).
 */

import type { CachedAnalysis, CacheKey, CacheStats, CacheResult } from './types';
import { MemoryCache } from './memory';
import { IndexedDBCache } from './indexeddb';
import { generateCacheKey, logCacheOperation } from './utils';

export class CacheManager {
  private memoryCache: MemoryCache;
  private indexedDBCache: IndexedDBCache;
  private stats: CacheStats;
  private initialized: boolean = false;

  constructor(memoryCacheSize: number = 1000) {
    this.memoryCache = new MemoryCache(memoryCacheSize);
    this.indexedDBCache = new IndexedDBCache();
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      networkCalls: 0,
      totalQueries: 0,
    };

    console.log('[CACHE MANAGER] Initialized');
  }

  /**
   * Initialize cache system
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[CACHE MANAGER] Initializing cache layers...');

    try {
      await this.indexedDBCache.init();
      this.initialized = true;
      console.log('[CACHE MANAGER] All cache layers ready');
    } catch (error) {
      console.error('[CACHE MANAGER] Initialization error:', error);
      console.warn('[CACHE MANAGER] Falling back to memory-only cache');
      this.initialized = true; // Continue with memory cache only
    }
  }

  /**
   * Get cached analysis (cascading lookup)
   */
  async get(params: CacheKey): Promise<CacheResult> {
    const key = generateCacheKey(params);
    const queryStart = performance.now();

    this.stats.totalQueries++;

    console.log('[CACHE MANAGER] ===== Cache Query =====');
    console.log('[CACHE MANAGER] Key:', key);

    // Step 1: Check memory cache
    const memoryStart = performance.now();
    const memoryResult = this.memoryCache.get(key);
    const memoryDuration = performance.now() - memoryStart;

    if (memoryResult) {
      this.stats.memoryHits++;
      const totalDuration = performance.now() - queryStart;
      logCacheOperation('get', 'memory', memoryDuration, true, {
        fen: params.fen.slice(0, 50) + '...',
        depth: params.depth,
        multipv: params.multipv,
      });
      console.log(`[CACHE MANAGER] Total query time: ${totalDuration.toFixed(2)}ms`);

      return {
        data: memoryResult,
        source: 'memory',
        duration: totalDuration,
      };
    }

    this.stats.memoryMisses++;
    logCacheOperation('get', 'memory', memoryDuration, false);

    // Step 2: Check IndexedDB cache
    const indexedDBStart = performance.now();
    const indexedDBResult = await this.indexedDBCache.get(key);
    const indexedDBDuration = performance.now() - indexedDBStart;

    if (indexedDBResult) {
      this.stats.indexedDBHits++;
      logCacheOperation('get', 'indexeddb', indexedDBDuration, true, {
        fen: params.fen.slice(0, 50) + '...',
        age: ((Date.now() - indexedDBResult.timestamp) / 1000 / 60).toFixed(1) + ' minutes',
      });

      // Promote to memory cache for faster future access
      console.log('[CACHE MANAGER] Promoting to memory cache');
      this.memoryCache.set(key, indexedDBResult);

      const totalDuration = performance.now() - queryStart;
      console.log(`[CACHE MANAGER] Total query time: ${totalDuration.toFixed(2)}ms`);

      return {
        data: indexedDBResult,
        source: 'indexeddb',
        duration: totalDuration,
      };
    }

    this.stats.indexedDBMisses++;
    logCacheOperation('get', 'indexeddb', indexedDBDuration, false);

    // Step 3: Not found in any cache
    const totalDuration = performance.now() - queryStart;
    console.log('[CACHE MANAGER] Cache miss - network call required');
    console.log(`[CACHE MANAGER] Total query time: ${totalDuration.toFixed(2)}ms`);

    return {
      data: null,
      source: null,
      duration: totalDuration,
    };
  }

  /**
   * Store analysis in cache (saves to both layers)
   */
  async set(params: CacheKey, value: CachedAnalysis): Promise<void> {
    const key = generateCacheKey(params);
    const setStart = performance.now();

    console.log('[CACHE MANAGER] Storing in cache layers...');

    // Store in memory (synchronous, fast)
    const memoryStart = performance.now();
    this.memoryCache.set(key, value);
    const memoryDuration = performance.now() - memoryStart;
    console.log(`[CACHE MANAGER] Memory cache: ${memoryDuration.toFixed(2)}ms`);

    // Store in IndexedDB (asynchronous, slower)
    const indexedDBStart = performance.now();
    await this.indexedDBCache.set(key, value);
    const indexedDBDuration = performance.now() - indexedDBStart;
    console.log(`[CACHE MANAGER] IndexedDB cache: ${indexedDBDuration.toFixed(2)}ms`);

    const totalDuration = performance.now() - setStart;
    console.log(`[CACHE MANAGER] Total store time: ${totalDuration.toFixed(2)}ms`);
    console.log('[CACHE MANAGER] Current cache sizes:', {
      memory: this.memoryCache.size(),
      indexedDB: '(async)',
    });
  }

  /**
   * Record a network call (for statistics)
   */
  recordNetworkCall(): void {
    this.stats.networkCalls++;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed statistics including cache sizes
   */
  async getDetailedStats(): Promise<{
    stats: CacheStats;
    memory: { size: number; maxSize: number; utilizationPercent: number };
    indexedDB: { count: number; estimatedSize: number };
    hitRate: {
      overall: number;
      memory: number;
      indexedDB: number;
    };
  }> {
    const memoryStats = this.memoryCache.getStats();
    const indexedDBStats = await this.indexedDBCache.getStats();

    const totalHits = this.stats.memoryHits + this.stats.indexedDBHits;
    const totalQueries = this.stats.totalQueries;

    return {
      stats: this.stats,
      memory: memoryStats,
      indexedDB: indexedDBStats,
      hitRate: {
        overall: totalQueries > 0 ? (totalHits / totalQueries) * 100 : 0,
        memory: totalQueries > 0 ? (this.stats.memoryHits / totalQueries) * 100 : 0,
        indexedDB: totalQueries > 0 ? (this.stats.indexedDBHits / totalQueries) * 100 : 0,
      },
    };
  }

  /**
   * Print detailed statistics to console
   */
  async printStats(): Promise<void> {
    const stats = await this.getDetailedStats();

    console.log('========================================');
    console.log('CACHE STATISTICS');
    console.log('========================================');
    console.log('Query Stats:');
    console.log(`  Total Queries: ${stats.stats.totalQueries}`);
    console.log(`  Memory Hits: ${stats.stats.memoryHits}`);
    console.log(`  IndexedDB Hits: ${stats.stats.indexedDBHits}`);
    console.log(`  Network Calls: ${stats.stats.networkCalls}`);
    console.log('');
    console.log('Hit Rates:');
    console.log(`  Overall: ${stats.hitRate.overall.toFixed(1)}%`);
    console.log(`  Memory: ${stats.hitRate.memory.toFixed(1)}%`);
    console.log(`  IndexedDB: ${stats.hitRate.indexedDB.toFixed(1)}%`);
    console.log('');
    console.log('Cache Sizes:');
    console.log(`  Memory: ${stats.memory.size}/${stats.memory.maxSize} (${stats.memory.utilizationPercent.toFixed(1)}%)`);
    console.log(`  IndexedDB: ${stats.indexedDB.count} entries (~${(stats.indexedDB.estimatedSize / 1024).toFixed(1)}KB)`);
    console.log('========================================');
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    console.log('[CACHE MANAGER] Clearing all caches...');
    this.memoryCache.clear();
    await this.indexedDBCache.clear();
    console.log('[CACHE MANAGER] All caches cleared');
  }

  /**
   * Cleanup old IndexedDB entries
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    console.log(`[CACHE MANAGER] Cleaning up entries older than ${olderThanDays} days...`);
    const deletedCount = await this.indexedDBCache.cleanup(olderThanDays);
    console.log(`[CACHE MANAGER] Cleanup complete: ${deletedCount} entries removed`);
    return deletedCount;
  }
}
