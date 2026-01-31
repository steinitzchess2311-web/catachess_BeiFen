/**
 * Priority Queue
 *
 * Priority queue implementation for precompute tasks
 */

import type { PrecomputeTask } from './types';

interface QueueItem {
  task: PrecomputeTask;
  priority: number;
}

export class PriorityQueue {
  private items: QueueItem[] = [];
  private taskIds: Set<string> = new Set();

  /**
   * Insert task into queue with priority
   */
  insert(task: PrecomputeTask, priority: number): boolean {
    // Check for duplicates
    if (this.taskIds.has(task.id)) {
      console.log(
        `[PRIORITY QUEUE] Skip duplicate task | ` +
        `ID: ${task.id} | ` +
        `Move: ${task.move}`
      );
      return false;
    }

    // Insert in priority order (higher priority first)
    const item: QueueItem = { task, priority };
    let inserted = false;

    for (let i = 0; i < this.items.length; i++) {
      if (priority > this.items[i].priority) {
        this.items.splice(i, 0, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.items.push(item);
    }

    this.taskIds.add(task.id);

    console.log(
      `[PRIORITY QUEUE] ✓ Task inserted | ` +
      `Priority: ${priority} | ` +
      `Position: ${this.items.findIndex(i => i.task.id === task.id) + 1}/${this.size()} | ` +
      `Move: ${task.move} | ` +
      `Line: ${task.lineIndex + 1} | ` +
      `TreeDepth: ${task.treeDepth}`
    );

    return true;
  }

  /**
   * Dequeue highest priority task
   */
  dequeue(): PrecomputeTask | null {
    if (this.items.length === 0) {
      return null;
    }

    const item = this.items.shift();
    if (!item) return null;

    this.taskIds.delete(item.task.id);

    console.log(
      `[PRIORITY QUEUE] ✓ Task dequeued | ` +
      `Priority: ${item.priority} | ` +
      `Remaining: ${this.size()} | ` +
      `Move: ${item.task.move} | ` +
      `Line: ${item.task.lineIndex + 1}`
    );

    return item.task;
  }

  /**
   * Peek at highest priority task without removing
   */
  peek(): PrecomputeTask | null {
    return this.items[0]?.task || null;
  }

  /**
   * Check if task exists in queue
   */
  has(taskId: string): boolean {
    return this.taskIds.has(taskId);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    const count = this.items.length;
    this.items = [];
    this.taskIds.clear();

    console.log(`[PRIORITY QUEUE] ✓ Queue cleared | Tasks removed: ${count}`);
  }

  /**
   * Get all tasks (for debugging)
   */
  getAll(): PrecomputeTask[] {
    return this.items.map(item => item.task);
  }

  /**
   * Get tasks by status
   */
  getByStatus(status: PrecomputeTask['status']): PrecomputeTask[] {
    return this.items
      .map(item => item.task)
      .filter(task => task.status === status);
  }

  /**
   * Remove specific task
   */
  remove(taskId: string): boolean {
    const index = this.items.findIndex(item => item.task.id === taskId);

    if (index === -1) {
      return false;
    }

    const task = this.items[index].task;
    this.items.splice(index, 1);
    this.taskIds.delete(taskId);

    console.log(
      `[PRIORITY QUEUE] ✓ Task removed | ` +
      `ID: ${taskId} | ` +
      `Move: ${task.move} | ` +
      `Remaining: ${this.size()}`
    );

    return true;
  }

  /**
   * Get queue summary for logging
   */
  getSummary(): string {
    const byTreeDepth: Record<number, number> = {};
    const byStatus: Record<string, number> = {};

    this.items.forEach(item => {
      const depth = item.task.treeDepth;
      const status = item.task.status;

      byTreeDepth[depth] = (byTreeDepth[depth] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return (
      `Total: ${this.size()} | ` +
      `Horizontal: ${byTreeDepth[0] || 0} | ` +
      `Vertical: ${Object.keys(byTreeDepth).filter(k => Number(k) > 0).reduce((sum, k) => sum + byTreeDepth[Number(k)], 0)} | ` +
      `Pending: ${byStatus.pending || 0}`
    );
  }
}
