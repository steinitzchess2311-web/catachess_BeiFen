/**
 * IndexedDB Cache (L2)
 *
 * Persistent browser storage for engine analysis.
 */

import type { CachedAnalysis } from './types';
import { isIndexedDBAvailable } from './utils';

export class IndexedDBCache {
  private dbName = 'CatachessEngineCache';
  private storeName = 'analyses';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isAvailable: boolean = false;

  // Capacity management
  private readonly maxSizeBytes = 50 * 1024 * 1024; // 50MB hard limit
  private readonly targetSizeBytes = 40 * 1024 * 1024; // 40MB target after cleanup
  private readonly estimatedBytesPerEntry = 600; // Rough estimate per analysis

  constructor() {
    this.isAvailable = isIndexedDBAvailable();

    if (!this.isAvailable) {
      console.warn('[CACHE INDEXEDDB] IndexedDB not available in this browser');
    }
  }

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    // Return existing init promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Skip if not available
    if (!this.isAvailable) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[CACHE INDEXEDDB] Failed to open database:', request.error);
        this.isAvailable = false;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[CACHE INDEXEDDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });

          // Create indexes
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('fen', 'fen', { unique: false });

          console.log('[CACHE INDEXEDDB] Object store created with indexes');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached analysis
   */
  async get(key: string): Promise<CachedAnalysis | null> {
    if (!this.isAvailable || !this.db) {
      return null;
    }

    try {
      return await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Extract the analysis data (remove 'key' property)
            const { key: _, ...analysis } = result;
            resolve(analysis as CachedAnalysis);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Get failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Get error:', error);
      return null;
    }
  }

  /**
   * Store analysis in cache
   */
  async set(key: string, value: CachedAnalysis): Promise<void> {
    if (!this.isAvailable || !this.db) {
      return;
    }

    try {
      // Check capacity and evict old entries if needed
      await this.ensureSpace();

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        // Store with key embedded
        const request = store.put({ key, ...value });

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Set failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Set error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (!this.isAvailable || !this.db) {
      return false;
    }

    try {
      const result = await this.get(key);
      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    if (!this.isAvailable || !this.db) {
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('[CACHE INDEXEDDB] Cleared all entries');
          resolve();
        };

        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Clear failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; estimatedSize: number }> {
    if (!this.isAvailable || !this.db) {
      return { count: 0, estimatedSize: 0 };
    }

    try {
      return await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onsuccess = () => {
          // Rough estimation: 1KB per entry
          const count = request.result;
          const estimatedSize = count * 1024;
          resolve({ count, estimatedSize });
        };

        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Count failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Stats error:', error);
      return { count: 0, estimatedSize: 0 };
    }
  }

  /**
   * Cleanup old entries (older than specified days)
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    if (!this.isAvailable || !this.db) {
      return 0;
    }

    try {
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            console.log(`[CACHE INDEXEDDB] Cleaned up ${deletedCount} old entries`);
            resolve();
          }
        };

        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Cleanup failed:', request.error);
          reject(request.error);
        };
      });

      return deletedCount;
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Ensure sufficient space by evicting old entries if needed
   */
  private async ensureSpace(): Promise<void> {
    if (!this.isAvailable || !this.db) {
      return;
    }

    try {
      const stats = await this.getStats();
      const currentSize = stats.estimatedSize;

      if (currentSize >= this.maxSizeBytes) {
        const bytesToFree = currentSize - this.targetSizeBytes;
        console.log(
          `[CACHE INDEXEDDB] ⚠️ Size limit reached (${(currentSize / 1024 / 1024).toFixed(1)}MB / ${(this.maxSizeBytes / 1024 / 1024).toFixed(0)}MB)`
        );
        console.log(
          `[CACHE INDEXEDDB] Evicting oldest entries to free ~${(bytesToFree / 1024 / 1024).toFixed(1)}MB...`
        );

        const deletedCount = await this.evictOldest(bytesToFree);

        const newStats = await this.getStats();
        console.log(
          `[CACHE INDEXEDDB] ✓ Evicted ${deletedCount} entries, new size: ${(newStats.estimatedSize / 1024 / 1024).toFixed(1)}MB`
        );
      }
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Ensure space error:', error);
    }
  }

  /**
   * Evict oldest entries to free specified amount of space
   */
  private async evictOldest(bytesToFree: number): Promise<number> {
    if (!this.isAvailable || !this.db) {
      return 0;
    }

    try {
      let freedBytes = 0;
      let deletedCount = 0;

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');

        // Open cursor in ascending order (oldest first)
        const request = index.openCursor(null, 'next');

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;

          if (cursor && freedBytes < bytesToFree) {
            // Delete this entry
            cursor.delete();
            freedBytes += this.estimatedBytesPerEntry;
            deletedCount++;

            // Continue to next oldest entry
            cursor.continue();
          } else {
            // Done: either freed enough space or no more entries
            resolve();
          }
        };

        request.onerror = () => {
          console.error('[CACHE INDEXEDDB] Evict oldest failed:', request.error);
          reject(request.error);
        };
      });

      return deletedCount;
    } catch (error) {
      console.error('[CACHE INDEXEDDB] Evict oldest error:', error);
      return 0;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[CACHE INDEXEDDB] Database connection closed');
    }
  }
}
