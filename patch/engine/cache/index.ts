/**
 * Engine Cache Module
 *
 * Unified export for the caching system.
 */

export { CacheManager } from './manager';
export { MemoryCache } from './memory';
export { IndexedDBCache } from './indexeddb';

export type {
  CachedAnalysis,
  CacheKey,
  CacheStats,
  CacheLayer,
  CacheResult,
} from './types';

export {
  generateCacheKey,
  parseCacheKey,
  hashFen,
  logCacheOperation,
  estimateSize,
  isIndexedDBAvailable,
} from './utils';

/**
 * Singleton cache manager instance
 */
let cacheManagerInstance: CacheManager | null = null;

/**
 * Get or create the global cache manager instance
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();

    // Initialize asynchronously
    cacheManagerInstance.init().catch((error) => {
      console.error('[CACHE] Failed to initialize cache manager:', error);
    });
  }

  return cacheManagerInstance;
}

/**
 * Reset the cache manager instance (useful for testing)
 */
export function resetCacheManager(): void {
  cacheManagerInstance = null;
}
