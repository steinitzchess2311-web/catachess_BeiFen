/**
 * Precompute Manager
 *
 * Core manager for position precomputation system
 */

import { analyzeWithFallback } from '../client';
import { generateCacheKey } from '../cache/utils';
import type { EngineAnalysis } from '../types';
import { MoveParser } from './move-parser';
import { PriorityQueue } from './queue';
import { StatsTracker } from './stats';
import { PrecomputeStorage } from './storage';
import type {
  PrecomputeTask,
  PrecomputeSettings,
  PrecomputeStatus,
  PRIORITY,
} from './types';

const DEFAULT_SETTINGS: PrecomputeSettings = {
  enabled: true,
  horizontalDepth: 5,
  verticalDepth: 2,
  delayMs: 100,
  maxConcurrent: 1,
};

export class PrecomputeManager {
  private settings: PrecomputeSettings = DEFAULT_SETTINGS;
  private queue: PriorityQueue = new PriorityQueue();
  private stats: StatsTracker = new StatsTracker();

  private currentSessionController: AbortController | null = null;
  private taskControllers: Map<string, AbortController> = new Map();

  private running = false;
  private runningTasks = 0;
  private currentTask: PrecomputeTask | null = null;

  private cacheManager: any = null;

  constructor() {
    console.log(
      `[PRECOMPUTE MANAGER] Initializing | ` +
      `Settings: ${JSON.stringify(this.settings)}`
    );
  }

  /**
   * Initialize with cache manager
   */
  init(cacheManager: any): void {
    this.cacheManager = cacheManager;
    this.currentSessionController = new AbortController();

    console.log(`[PRECOMPUTE MANAGER] ✓ Initialized with cache manager`);
  }

  /**
   * Trigger precomputation for a position
   */
  async trigger(
    fen: string,
    depth: number,
    multipv: number,
    result: EngineAnalysis
  ): Promise<void> {
    if (!this.settings.enabled) {
      console.log(`[PRECOMPUTE MANAGER] Disabled, skipping trigger`);
      return;
    }

    if (!this.cacheManager) {
      console.error(`[PRECOMPUTE MANAGER] ❌ Cache manager not initialized`);
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[PRECOMPUTE MANAGER] 🚀 Trigger started`);
    console.log(`[PRECOMPUTE MANAGER] FEN: ${fen.slice(0, 50)}...`);
    console.log(`[PRECOMPUTE MANAGER] Depth: ${depth}, MultiPV: ${multipv}`);
    console.log(`[PRECOMPUTE MANAGER] Lines: ${result.lines.length}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Extract horizontal positions (1-5 lines)
      await this.extractHorizontalTasks(fen, depth, multipv, result);

      // Extract vertical positions (depth 1-2)
      await this.extractVerticalTasks(fen, depth, multipv, result);

      // Start processing queue
      this.start();

    } catch (error) {
      console.error(`[PRECOMPUTE MANAGER] ❌ Trigger failed:`, error);
    }
  }

  /**
   * Extract horizontal tasks (1-5 lines)
   */
  private async extractHorizontalTasks(
    fen: string,
    depth: number,
    multipv: number,
    result: EngineAnalysis
  ): Promise<void> {
    console.log(
      `[PRECOMPUTE MANAGER] Extracting horizontal tasks | ` +
      `MaxLines: ${this.settings.horizontalDepth}`
    );

    const positions = MoveParser.extractNextPositions(
      fen,
      result.lines,
      this.settings.horizontalDepth
    );

    console.log(
      `[PRECOMPUTE MANAGER] ✓ Extracted ${positions.length} horizontal positions`
    );

    for (const pos of positions) {
      const priority = this.calculatePriority(pos.lineIndex, pos.depth);

      await this.addTask({
        fen: pos.fen,
        depth,
        multipv,
        priority,
        fromFEN: fen,
        move: pos.move,
        lineIndex: pos.lineIndex,
        treeDepth: 0,
      });
    }
  }

  /**
   * Extract vertical tasks (depth 1-2)
   */
  private async extractVerticalTasks(
    fen: string,
    depth: number,
    multipv: number,
    result: EngineAnalysis
  ): Promise<void> {
    if (this.settings.verticalDepth === 0) {
      console.log(`[PRECOMPUTE MANAGER] Vertical depth = 0, skipping`);
      return;
    }

    console.log(
      `[PRECOMPUTE MANAGER] Extracting vertical tasks | ` +
      `MaxDepth: ${this.settings.verticalDepth}`
    );

    let totalVertical = 0;

    for (let i = 0; i < Math.min(this.settings.horizontalDepth, result.lines.length); i++) {
      const line = result.lines[i];

      const deepPositions = MoveParser.extractDeepPositions(
        fen,
        line.pv,
        this.settings.verticalDepth
      );

      console.log(
        `[PRECOMPUTE MANAGER] Line ${i + 1} vertical | ` +
        `Extracted ${deepPositions.length} positions`
      );

      for (const pos of deepPositions) {
        const priority = this.calculatePriority(i, pos.depth);

        await this.addTask({
          fen: pos.fen,
          depth,
          multipv,
          priority,
          fromFEN: pos.fromFEN,
          move: pos.move,
          lineIndex: i,
          treeDepth: pos.depth,
        });

        totalVertical++;
      }
    }

    console.log(
      `[PRECOMPUTE MANAGER] ✓ Extracted ${totalVertical} vertical positions`
    );
  }

  /**
   * Add task to queue
   */
  async addTask(params: {
    fen: string;
    depth: number;
    multipv: number;
    priority: number;
    fromFEN: string;
    move: string;
    lineIndex: number;
    treeDepth: number;
  }): Promise<void> {
    const cacheKey = this.generateCacheKey(params.fen, params.depth, params.multipv);

    // Check if should precompute
    const should = await PrecomputeStorage.shouldPrecompute(
      cacheKey,
      params.fen,
      params.depth,
      params.multipv,
      this.cacheManager,
      this.queue
    );

    if (!should) {
      this.stats.cacheHit(cacheKey);
      return;
    }

    const task: PrecomputeTask = {
      id: `${cacheKey}_${Date.now()}`,
      cacheKey,
      fen: params.fen,
      depth: params.depth,
      multipv: params.multipv,
      priority: params.priority,
      fromFEN: params.fromFEN,
      move: params.move,
      lineIndex: params.lineIndex,
      treeDepth: params.treeDepth,
      createdAt: Date.now(),
      status: 'pending',
      retries: 0,
    };

    const inserted = this.queue.insert(task, params.priority);

    if (inserted) {
      this.stats.taskTriggered(task);
    }
  }

  /**
   * Start processing queue
   */
  start(): void {
    if (this.running) {
      console.log(`[PRECOMPUTE MANAGER] Already running`);
      return;
    }

    this.running = true;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[PRECOMPUTE MANAGER] ▶️ Starting queue processing`);
    console.log(`[PRECOMPUTE MANAGER] Queue size: ${this.queue.size()}`);
    console.log(`[PRECOMPUTE MANAGER] ${this.queue.getSummary()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Start processing after delay
    setTimeout(() => {
      this.processQueue();
    }, this.settings.delayMs);
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    while (this.running && this.queue.size() > 0) {
      // Wait for available slot
      if (this.runningTasks >= this.settings.maxConcurrent) {
        await this.waitForSlot();
        continue;
      }

      // Get next task
      const task = this.queue.dequeue();
      if (!task) break;

      // Execute task
      this.runningTasks++;
      this.currentTask = task;

      this.executeTask(task).finally(() => {
        this.runningTasks--;
        this.currentTask = null;
      });

      // Delay between tasks
      await this.delay(this.getTaskDelay(task));
    }

    if (this.queue.size() === 0) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[PRECOMPUTE MANAGER] ✓ Queue processing complete`);
      console.log(`${'='.repeat(80)}\n`);

      this.stats.printSummary();
      this.running = false;
    }
  }

  /**
   * Execute single task
   */
  private async executeTask(task: PrecomputeTask): Promise<void> {
    const startTime = Date.now();

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`[PRECOMPUTE MANAGER] ▶️ Executing task`);
    console.log(`[PRECOMPUTE MANAGER] Move: ${task.move}`);
    console.log(`[PRECOMPUTE MANAGER] Line: ${task.lineIndex + 1}`);
    console.log(`[PRECOMPUTE MANAGER] TreeDepth: ${task.treeDepth}`);
    console.log(`[PRECOMPUTE MANAGER] Priority: ${task.priority}`);
    console.log(`[PRECOMPUTE MANAGER] FEN: ${task.fen.slice(0, 50)}...`);
    console.log(`${'-'.repeat(80)}\n`);

    try {
      task.status = 'running';
      task.startedAt = Date.now();

      // Create abort controller for this task
      const controller = new AbortController();
      this.taskControllers.set(task.id, controller);

      // Double-check cache (might have been computed while queued)
      const shouldRun = await PrecomputeStorage.shouldPrecompute(
        task.cacheKey,
        task.fen,
        task.depth,
        task.multipv,
        this.cacheManager,
        this.queue
      );

      if (!shouldRun) {
        task.status = 'completed';
        console.log(
          `[PRECOMPUTE MANAGER] ✓ Skip (cached during queue) | ` +
          `Move: ${task.move}`
        );
        this.stats.cacheHit(task.cacheKey);
        return;
      }

      // Execute analysis
      console.log(`[PRECOMPUTE MANAGER] 🔄 Calling engine API...`);

      const result = await analyzeWithFallback(
        task.fen,
        task.depth,
        task.multipv
      );

      console.log(
        `[PRECOMPUTE MANAGER] ✓ Engine returned | ` +
        `Lines: ${result.lines.length} | ` +
        `Source: ${result.source}`
      );

      // Store result
      await PrecomputeStorage.storeResult(task, result, this.cacheManager);

      task.status = 'completed';
      task.completedAt = Date.now();

      const duration = Date.now() - startTime;

      this.stats.taskCompleted(task, duration);

      console.log(`\n${'-'.repeat(80)}`);
      console.log(
        `[PRECOMPUTE MANAGER] ✅ Task completed | ` +
        `Duration: ${duration}ms | ` +
        `Move: ${task.move} | ` +
        `Line: ${task.lineIndex + 1}`
      );
      console.log(`${'-'.repeat(80)}\n`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        task.status = 'cancelled';
        this.stats.taskCancelled(task);

        console.log(
          `[PRECOMPUTE MANAGER] Task cancelled | ` +
          `Move: ${task.move}`
        );
        return;
      }

      task.status = 'failed';
      task.error = error.message;

      const duration = Date.now() - startTime;

      this.stats.taskFailed(task, error.message);

      console.error(`\n${'-'.repeat(80)}`);
      console.error(
        `[PRECOMPUTE MANAGER] ❌ Task failed | ` +
        `Duration: ${duration}ms | ` +
        `Move: ${task.move} | ` +
        `Error: ${error.message}`
      );
      console.error(`${'-'.repeat(80)}\n`);

    } finally {
      this.taskControllers.delete(task.id);
    }
  }

  /**
   * Cancel current session
   */
  cancelCurrentSession(): void {
    const queueSize = this.queue.size();
    const runningCount = this.runningTasks;
    const totalCancelled = queueSize + runningCount;

    // Don't log if nothing to cancel
    if (totalCancelled === 0) {
      console.log(`[PRECOMPUTE MANAGER] No active tasks to cancel`);
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[PRECOMPUTE MANAGER] ⏹️ Cancelling current session`);
    console.log(`[PRECOMPUTE MANAGER] Pending in queue: ${queueSize}`);
    console.log(`[PRECOMPUTE MANAGER] Currently running: ${runningCount}`);
    console.log(`[PRECOMPUTE MANAGER] Total cancelled: ${totalCancelled}`);
    console.log(`[PRECOMPUTE MANAGER] ${this.queue.getSummary()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Abort all tasks
    this.currentSessionController?.abort();
    this.currentSessionController = new AbortController();

    // Clear task controllers
    this.taskControllers.forEach(controller => controller.abort());
    this.taskControllers.clear();

    // Clear queue
    this.queue.clear();

    // Stop running
    this.running = false;
    this.runningTasks = 0;
    this.currentTask = null;

    console.log(
      `[PRECOMPUTE MANAGER] ✓ Session cancelled | ` +
      `Removed ${totalCancelled} tasks (${queueSize} pending + ${runningCount} running)`
    );
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<PrecomputeSettings>): void {
    this.settings = { ...this.settings, ...settings };

    console.log(
      `[PRECOMPUTE MANAGER] Settings updated | ` +
      `New settings: ${JSON.stringify(this.settings)}`
    );
  }

  /**
   * Get status
   */
  getStatus(): PrecomputeStatus {
    return {
      enabled: this.settings.enabled,
      running: this.running,
      queueSize: this.queue.size(),
      completed: this.stats.getStats().completed,
      failed: this.stats.getStats().failed,
      cancelled: this.stats.getStats().cancelled,
      currentTask: this.currentTask
        ? {
            move: this.currentTask.move,
            lineIndex: this.currentTask.lineIndex,
            treeDepth: this.currentTask.treeDepth,
            elapsedMs: this.currentTask.startedAt
              ? Date.now() - this.currentTask.startedAt
              : 0,
          }
        : undefined,
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return this.stats.getStats();
  }

  /**
   * Print summary
   */
  printSummary(): void {
    this.stats.printSummary();
  }

  // Helper methods

  private calculatePriority(lineIndex: number, treeDepth: number): number {
    const PRIORITY_MAP = {
      HORIZONTAL_1: 100,
      HORIZONTAL_2: 90,
      HORIZONTAL_3: 80,
      HORIZONTAL_4: 70,
      HORIZONTAL_5: 60,
      VERTICAL_DEPTH_1: 50,
      VERTICAL_DEPTH_2: 40,
      VERTICAL_DEPTH_3: 30,
    };

    if (treeDepth === 0) {
      const key = `HORIZONTAL_${lineIndex + 1}` as keyof typeof PRIORITY_MAP;
      return PRIORITY_MAP[key] || 50;
    }

    const key = `VERTICAL_DEPTH_${treeDepth}` as keyof typeof PRIORITY_MAP;
    return PRIORITY_MAP[key] || 10;
  }

  private generateCacheKey(fen: string, depth: number, multipv: number): string {
    return generateCacheKey({ fen, depth, multipv });
  }

  private getTaskDelay(task: PrecomputeTask): number {
    if (task.treeDepth === 0) {
      return 100; // 100ms for horizontal
    }
    return 1000 * task.treeDepth; // 1s, 2s, 3s for vertical
  }

  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this.runningTasks < this.settings.maxConcurrent) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
