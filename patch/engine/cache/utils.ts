/**
 * Cache Utilities
 *
 * Helper functions for cache operations.
 */

import type { CacheKey, CacheLayer } from './types';

/**
 * Generate a unique cache key from parameters
 */
export function generateCacheKey(params: CacheKey): string {
  return `${params.engineMode}:${params.depth}:${params.multipv}:${params.fen}`;
}

/**
 * Parse cache key back to parameters
 */
export function parseCacheKey(key: string): CacheKey | null {
  const parts = key.split(':');
  if (parts.length < 4) return null;

  const engineMode = parts[0] as 'cloud' | 'sf';
  const depth = parseInt(parts[1], 10);
  const multipv = parseInt(parts[2], 10);
  const fen = parts.slice(3).join(':');

  if (isNaN(depth) || isNaN(multipv)) return null;

  return { engineMode, depth, multipv, fen };
}

/**
 * Simple FEN hash (for now just use FEN directly)
 * Can be replaced with MD5/SHA if needed
 */
export function hashFen(fen: string): string {
  return fen;
}

/**
 * Log cache operation with performance data
 */
export function logCacheOperation(
  operation: string,
  layer: CacheLayer,
  duration: number,
  hit: boolean,
  details?: any
): void {
  const emoji = hit ? '✓' : '✗';
  const status = hit ? 'HIT' : 'MISS';
  const layerUpper = layer.toUpperCase();

  console.log(`[CACHE ${layerUpper}] ${emoji} ${operation} - ${status} (${duration.toFixed(2)}ms)`);

  if (details) {
    console.log(`[CACHE ${layerUpper}] Details:`, details);
  }
}

/**
 * Estimate size of cached data (rough approximation)
 */
export function estimateSize(data: any): number {
  const json = JSON.stringify(data);
  return new Blob([json]).size;
}

/**
 * Check if IndexedDB is available in this browser
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}
