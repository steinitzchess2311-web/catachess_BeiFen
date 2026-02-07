/**
 * Movement Engine - Handles cat movement and boundaries
 */

import type { Position } from '../types';

export interface MovementConfig {
  speed: number;
  minDistance: number;
  maxDistance: number;
}

export class MovementEngine {
  private currentPosition: Position;
  private targetPosition: Position | null = null;
  private isMoving = false;
  private animationFrameId: number | null = null;
  private readonly config: MovementConfig;

  constructor(initialPosition: Position, config: Partial<MovementConfig> = {}) {
    this.currentPosition = { ...initialPosition };
    this.config = {
      speed: config.speed ?? 2,
      minDistance: config.minDistance ?? 100,
      maxDistance: config.maxDistance ?? 300,
    };
  }

  /**
   * Get current position
   */
  getPosition(): Position {
    return { ...this.currentPosition };
  }

  /**
   * Set position directly
   */
  setPosition(position: Position): void {
    this.currentPosition = { ...position };
    this.targetPosition = null;
    this.isMoving = false;
  }

  /**
   * Check if currently moving
   */
  isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  /**
   * Generate random target position within boundaries
   */
  generateRandomTarget(): Position {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      this.config.minDistance +
      Math.random() * (this.config.maxDistance - this.config.minDistance);

    const targetX = this.currentPosition.x + Math.cos(angle) * distance;
    const targetY = this.currentPosition.y + Math.sin(angle) * distance;

    return this.clampToBoundaries({ x: targetX, y: targetY });
  }

  /**
   * Start moving to a target position
   */
  moveTo(target: Position, onUpdate: (pos: Position, direction: 'left' | 'right') => void): void {
    this.targetPosition = this.clampToBoundaries(target);
    this.isMoving = true;

    const animate = () => {
      if (!this.targetPosition || !this.isMoving) {
        this.stopMovement();
        return;
      }

      const dx = this.targetPosition.x - this.currentPosition.x;
      const dy = this.targetPosition.y - this.currentPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.config.speed) {
        this.currentPosition = { ...this.targetPosition };
        this.stopMovement();
        onUpdate(this.currentPosition, dx > 0 ? 'right' : 'left');
        return;
      }

      const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
      this.currentPosition.x += (dx / distance) * this.config.speed;
      this.currentPosition.y += (dy / distance) * this.config.speed;

      onUpdate(this.currentPosition, direction);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop current movement
   */
  stopMovement(): void {
    this.isMoving = false;
    this.targetPosition = null;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clamp position to screen boundaries
   */
  private clampToBoundaries(pos: Position): Position {
    const margin = 100;
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;

    return {
      x: Math.max(margin, Math.min(maxX, pos.x)),
      y: Math.max(margin, Math.min(maxY, pos.y)),
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMovement();
  }
}
