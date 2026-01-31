/**
 * Precompute Statistics
 *
 * Tracks and reports precomputation statistics
 */

import type { PrecomputeStats, PrecomputeTask } from './types';

export class StatsTracker {
  private stats: PrecomputeStats = {
    totalTriggered: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    cacheHitRate: 0,
    avgDurationMs: 0,
    totalSavedMs: 0,
    horizontalCount: 0,
    verticalCount: 0,
    lastUpdated: Date.now(),
  };

  private durations: number[] = [];
  private readonly maxDurationsTracked = 100;

  /**
   * Record task triggered
   */
  taskTriggered(task: PrecomputeTask): void {
    this.stats.totalTriggered++;

    if (task.treeDepth === 0) {
      this.stats.horizontalCount++;
    } else {
      this.stats.verticalCount++;
    }

    this.stats.lastUpdated = Date.now();

    console.log(
      `[STATS] Task triggered | ` +
      `Total: ${this.stats.totalTriggered} | ` +
      `Horizontal: ${this.stats.horizontalCount} | ` +
      `Vertical: ${this.stats.verticalCount}`
    );
  }

  /**
   * Record task completed
   */
  taskCompleted(task: PrecomputeTask, durationMs: number): void {
    this.stats.completed++;
    this.durations.push(durationMs);

    // Keep only recent durations
    if (this.durations.length > this.maxDurationsTracked) {
      this.durations.shift();
    }

    // Update average duration
    this.stats.avgDurationMs =
      this.durations.reduce((sum, d) => sum + d, 0) / this.durations.length;

    this.stats.lastUpdated = Date.now();

    console.log(
      `[STATS] ✓ Task completed | ` +
      `Duration: ${durationMs}ms | ` +
      `Avg: ${Math.round(this.stats.avgDurationMs)}ms | ` +
      `Total completed: ${this.stats.completed} | ` +
      `Move: ${task.move}`
    );
  }

  /**
   * Record task failed
   */
  taskFailed(task: PrecomputeTask, error: string): void {
    this.stats.failed++;
    this.stats.lastUpdated = Date.now();

    console.warn(
      `[STATS] ✗ Task failed | ` +
      `Total failed: ${this.stats.failed} | ` +
      `Move: ${task.move} | ` +
      `Error: ${error}`
    );
  }

  /**
   * Record task cancelled
   */
  taskCancelled(task: PrecomputeTask): void {
    this.stats.cancelled++;
    this.stats.lastUpdated = Date.now();

    console.log(
      `[STATS] Task cancelled | ` +
      `Total cancelled: ${this.stats.cancelled} | ` +
      `Move: ${task.move}`
    );
  }

  /**
   * Record cache hit (task skipped because already cached)
   */
  cacheHit(cacheKey: string): void {
    // Update hit rate
    const total = this.stats.totalTriggered;
    const hits = total - (this.stats.completed + this.stats.failed);

    if (total > 0) {
      this.stats.cacheHitRate = hits / total;
    }

    console.log(
      `[STATS] Cache hit | ` +
      `Hit rate: ${(this.stats.cacheHitRate * 100).toFixed(1)}% | ` +
      `Key: ${cacheKey.slice(0, 60)}...`
    );
  }

  /**
   * Record time saved by precomputation
   */
  timeSaved(savedMs: number): void {
    this.stats.totalSavedMs += savedMs;

    console.log(
      `[STATS] ⚡ Time saved | ` +
      `This request: ${savedMs}ms | ` +
      `Total saved: ${Math.round(this.stats.totalSavedMs / 1000)}s`
    );
  }

  /**
   * Get current statistics
   */
  getStats(): PrecomputeStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    console.log(
      `[STATS] Resetting statistics | ` +
      `Previous total: ${this.stats.totalTriggered} | ` +
      `Completed: ${this.stats.completed} | ` +
      `Failed: ${this.stats.failed}`
    );

    this.stats = {
      totalTriggered: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      cacheHitRate: 0,
      avgDurationMs: 0,
      totalSavedMs: 0,
      horizontalCount: 0,
      verticalCount: 0,
      lastUpdated: Date.now(),
    };

    this.durations = [];
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const s = this.stats;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[STATS] PRECOMPUTE SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total triggered:     ${s.totalTriggered}`);
    console.log(`  - Horizontal:      ${s.horizontalCount}`);
    console.log(`  - Vertical:        ${s.verticalCount}`);
    console.log(`Completed:           ${s.completed}`);
    console.log(`Failed:              ${s.failed}`);
    console.log(`Cancelled:           ${s.cancelled}`);
    console.log(`Cache hit rate:      ${(s.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Avg duration:        ${Math.round(s.avgDurationMs)}ms`);
    console.log(`Total time saved:    ${Math.round(s.totalSavedMs / 1000)}s`);
    console.log(`Last updated:        ${new Date(s.lastUpdated).toLocaleTimeString()}`);
    console.log(`${'='.repeat(80)}\n`);
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    const total = this.stats.completed + this.stats.failed;
    return total > 0 ? this.stats.completed / total : 0;
  }

  /**
   * Get efficiency metrics
   */
  getEfficiencyMetrics(): {
    successRate: number;
    cacheHitRate: number;
    avgDurationMs: number;
    totalSavedSec: number;
  } {
    return {
      successRate: this.getSuccessRate(),
      cacheHitRate: this.stats.cacheHitRate,
      avgDurationMs: this.stats.avgDurationMs,
      totalSavedSec: Math.round(this.stats.totalSavedMs / 1000),
    };
  }
}
