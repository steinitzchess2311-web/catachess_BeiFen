/**
 * Precompute Storage
 *
 * Handles storing precomputed results to cache layers
 */

import type { EngineAnalysis } from '../types';
import type { CachedAnalysisMetadata, PrecomputeTask } from './types';

export class PrecomputeStorage {
  /**
   * Store result in cache layers
   */
  static async storeResult(
    task: PrecomputeTask,
    result: EngineAnalysis,
    cacheManager: any
  ): Promise<void> {
    const startTime = Date.now();

    console.log(
      `[PRECOMPUTE STORAGE] Storing result | ` +
      `Move: ${task.move} | ` +
      `Line: ${task.lineIndex + 1} | ` +
      `TreeDepth: ${task.treeDepth}`
    );

    const metadata: CachedAnalysisMetadata = {
      precomputed: true,
      precomputeLevel: task.treeDepth + 1,
      cachedAt: Date.now(),
      accessCount: 0,
      lastAccessAt: Date.now(),
    };

    const promises: Promise<void>[] = [];

    const cachedValue = {
      fen: task.fen,
      depth: task.depth,
      multipv: task.multipv,
      lines: result.lines,
      source: result.source,
      timestamp: Date.now(),
      metadata,
    };

    // Priority 1: Memory cache (fastest, must succeed)
    try {
      cacheManager.setMemory(task.cacheKey, cachedValue);
      console.log(
        `[PRECOMPUTE STORAGE] ✓ Memory cache updated | ` +
        `Key: ${task.cacheKey.slice(0, 60)}...`
      );
    } catch (error) {
      console.error(
        `[PRECOMPUTE STORAGE] ❌ Memory cache failed (critical):`,
        error
      );
    }

    // Priority 2: IndexedDB (persistent)
    promises.push(
      (async () => {
        try {
          await cacheManager.setIndexedDB(task.cacheKey, cachedValue);
          console.log(
            `[PRECOMPUTE STORAGE] ✓ IndexedDB updated | ` +
            `Key: ${task.cacheKey.slice(0, 60)}...`
          );
        } catch (error) {
          console.warn(
            `[PRECOMPUTE STORAGE] ⚠️ IndexedDB failed, data only in memory:`,
            error
          );
        }
      })()
    );

    // Priority 3: MongoDB (handled by backend API automatically)
    // No additional action needed - the API call already stored it

    await Promise.allSettled(promises);

    const duration = Date.now() - startTime;
    console.log(
      `[PRECOMPUTE STORAGE] ✓ Storage complete | ` +
      `Duration: ${duration}ms | ` +
      `Move: ${task.move}`
    );
  }

  /**
   * Check if position should be precomputed
   */
  static async shouldPrecompute(
    cacheKey: string,
    fen: string,
    depth: number,
    multipv: number,
    cacheManager: any,
    taskQueue: any
  ): Promise<boolean> {
    console.log(
      `[PRECOMPUTE STORAGE] Checking if should precompute | ` +
      `FEN: ${fen.slice(0, 30)}... | ` +
      `Depth: ${depth} | ` +
      `MultiPV: ${multipv}`
    );

    // Check 1: Memory cache (fastest)
    if (cacheManager.hasMemory(cacheKey)) {
      console.log(
        `[PRECOMPUTE STORAGE] ✗ Skip (memory hit) | ` +
        `Key: ${cacheKey.slice(0, 60)}...`
      );
      return false;
    }

    // Check 2: IndexedDB
    try {
      const indexedDBResult = await cacheManager.getIndexedDB(cacheKey);
      if (indexedDBResult) {
        console.log(
          `[PRECOMPUTE STORAGE] ✗ Skip (IndexedDB hit) | ` +
          `Key: ${cacheKey.slice(0, 60)}...`
        );

        // Promote to memory cache
        cacheManager.setMemory(cacheKey, indexedDBResult);

        return false;
      }
    } catch (error) {
      console.warn(
        `[PRECOMPUTE STORAGE] IndexedDB check failed:`,
        error
      );
    }

    // Check 3: Already in queue
    if (taskQueue.has(cacheKey)) {
      console.log(
        `[PRECOMPUTE STORAGE] ✗ Skip (already queued) | ` +
        `Key: ${cacheKey.slice(0, 60)}...`
      );
      return false;
    }

    // Check 4: MongoDB - don't check proactively, let API return naturally
    // If MongoDB has cache, API will return in <10ms

    console.log(
      `[PRECOMPUTE STORAGE] ✓ Should precompute | ` +
      `FEN: ${fen.slice(0, 30)}...`
    );

    return true;
  }

  /**
   * Update access metadata
   */
  static async updateAccessMetadata(
    cacheKey: string,
    cacheManager: any
  ): Promise<void> {
    try {
      const cached = await cacheManager.getIndexedDB(cacheKey);

      if (cached && cached.metadata) {
        cached.metadata.accessCount = (cached.metadata.accessCount || 0) + 1;
        cached.metadata.lastAccessAt = Date.now();

        await cacheManager.setIndexedDB(cacheKey, cached);

        console.log(
          `[PRECOMPUTE STORAGE] ✓ Access metadata updated | ` +
          `Access count: ${cached.metadata.accessCount} | ` +
          `Key: ${cacheKey.slice(0, 60)}...`
        );
      }
    } catch (error) {
      console.warn(
        `[PRECOMPUTE STORAGE] Failed to update access metadata:`,
        error
      );
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(cacheManager: any): Promise<{
    memoryCount: number;
    indexedDBCount: number;
    precomputedCount: number;
  }> {
    try {
      const memoryCount = cacheManager.getMemorySize();

      // Get IndexedDB stats
      // This would require implementing a count method in IndexedDB cache
      const indexedDBCount = 0; // Placeholder

      // Count precomputed entries
      const precomputedCount = 0; // Placeholder

      console.log(
        `[PRECOMPUTE STORAGE] Storage stats | ` +
        `Memory: ${memoryCount} | ` +
        `IndexedDB: ${indexedDBCount} | ` +
        `Precomputed: ${precomputedCount}`
      );

      return {
        memoryCount,
        indexedDBCount,
        precomputedCount,
      };
    } catch (error) {
      console.error(
        `[PRECOMPUTE STORAGE] Failed to get storage stats:`,
        error
      );

      return {
        memoryCount: 0,
        indexedDBCount: 0,
        precomputedCount: 0,
      };
    }
  }
}
