/**
 * Cache Types
 *
 * Type definitions for the engine analysis caching system.
 */

import type { EngineLine, EngineSource } from '../types';

/**
 * Cached analysis data structure
 */
export interface CachedAnalysis {
  fen: string;
  depth: number;
  multipv: number;
  lines: EngineLine[];
  source: EngineSource;
  timestamp: number;
}

/**
 * Cache key parameters
 */
export interface CacheKey {
  fen: string;
  depth: number;
  multipv: number;
  engineMode: 'cloud' | 'sf';
}

/**
 * Cache statistics
 */
export interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  indexedDBHits: number;
  indexedDBMisses: number;
  networkCalls: number;
  totalQueries: number;
}

/**
 * Cache layer source
 */
export type CacheLayer = 'memory' | 'indexeddb' | 'network';

/**
 * Cache query result
 */
export interface CacheResult {
  data: CachedAnalysis | null;
  source: CacheLayer | null;
  duration: number;
}
