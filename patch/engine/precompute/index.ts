/**
 * Precompute System
 *
 * Automatic position precomputation to improve analysis speed
 */

import { PrecomputeManager } from './manager';
import type {
  PrecomputeSettings,
  PrecomputeStatus,
  PrecomputeStats,
} from './types';

export type {
  PrecomputeSettings,
  PrecomputeStatus,
  PrecomputeStats,
  PrecomputeTask,
  NextPosition,
} from './types';

export { PrecomputeManager } from './manager';
export { MoveParser } from './move-parser';
export { PriorityQueue } from './queue';
export { StatsTracker } from './stats';
export { PrecomputeStorage } from './storage';

// Singleton instance
let precomputeManagerInstance: PrecomputeManager | null = null;

/**
 * Get or create precompute manager instance
 */
export function getPrecomputeManager(): PrecomputeManager {
  if (!precomputeManagerInstance) {
    console.log(`[PRECOMPUTE] Creating new PrecomputeManager instance`);
    precomputeManagerInstance = new PrecomputeManager();
  }

  return precomputeManagerInstance;
}

/**
 * Initialize precompute system with cache manager
 */
export function initPrecompute(cacheManager: any): void {
  console.log(`[PRECOMPUTE] Initializing precompute system`);

  const manager = getPrecomputeManager();
  manager.init(cacheManager);

  console.log(`[PRECOMPUTE] ✓ Precompute system initialized`);
}

/**
 * Update precompute settings
 */
export function updatePrecomputeSettings(settings: Partial<PrecomputeSettings>): void {
  console.log(`[PRECOMPUTE] Updating settings:`, settings);

  const manager = getPrecomputeManager();
  manager.updateSettings(settings);
}

/**
 * Get precompute status
 */
export function getPrecomputeStatus(): PrecomputeStatus {
  const manager = getPrecomputeManager();
  return manager.getStatus();
}

/**
 * Get precompute statistics
 */
export function getPrecomputeStats(): PrecomputeStats {
  const manager = getPrecomputeManager();
  return manager.getStats();
}

/**
 * Cancel current precompute session
 */
export function cancelPrecompute(): void {
  console.log(`[PRECOMPUTE] Cancelling precompute session`);

  const manager = getPrecomputeManager();
  manager.cancelCurrentSession();
}

/**
 * Print precompute summary to console
 */
export function printPrecomputeSummary(): void {
  const manager = getPrecomputeManager();
  manager.printSummary();
}
