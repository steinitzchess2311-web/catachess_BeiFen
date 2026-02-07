/**
 * Movement Engine - Handles cat movement along ground edge
 */

import type { Position } from '../types';

export interface MovementConfig {
  speed: number;
  groundOffset: number;  // Distance from bottom of screen
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
      speed: config.speed ?? 1.5,  // Slower, more natural speed
      groundOffset: config.groundOffset ?? 150,  // Cat walks on ground
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
   * Get ground Y position
   */
  private getGroundY(): number {
    return window.innerHeight - this.config.groundOffset;
  }

  /**
   * Generate random target position along ground edge
   * Cat only walks horizontally along the bottom edge
   */
  generateRandomTarget(): Position {
    const groundY = this.getGroundY();
    const margin = 50;
    const maxX = window.innerWidth - margin;

    // Random X position along the ground
    const targetX = margin + Math.random() * (maxX - margin * 2);

    return {
      x: targetX,
      y: groundY,  // Always walk on ground level
    };
  }

  /**
   * Generate random climb target (vertical movement along wall edge)
   */
  generateClimbTarget(): Position {
    const margin = 50;
    const minY = margin;
    const maxY = window.innerHeight - margin;

    // Randomly choose left or right wall
    const onLeftWall = Math.random() < 0.5;
    const wallX = onLeftWall ? margin : window.innerWidth - margin;

    // Random Y position along the wall
    const targetY = minY + Math.random() * (maxY - minY);

    return {
      x: wallX,
      y: targetY,
    };
  }

  /**
   * Start moving to a target position (smooth horizontal movement)
   */
  moveTo(target: Position, onUpdate: (pos: Position, direction: 'left' | 'right') => void): void {
    this.targetPosition = { ...target };
    this.isMoving = true;

    const animate = () => {
      if (!this.targetPosition || !this.isMoving) {
        this.stopMovement();
        return;
      }

      const dx = this.targetPosition.x - this.currentPosition.x;
      const dy = this.targetPosition.y - this.currentPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Reached target
      if (distance < this.config.speed) {
        this.currentPosition = { ...this.targetPosition };
        this.stopMovement();
        onUpdate(this.currentPosition, dx > 0 ? 'right' : 'left');
        return;
      }

      // Determine direction based on horizontal movement
      const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';

      // Move towards target
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
   * Climb animation - vertical movement along wall with rotation
   */
  climb(
    target: Position,
    onUpdate: (pos: Position, direction: 'left' | 'right', rotation: number) => void
  ): void {
    this.targetPosition = { ...target };
    this.isMoving = true;

    // Determine which wall we're climbing (left or right)
    const onLeftWall = target.x < window.innerWidth / 2;
    const rotation = onLeftWall ? -90 : 90;  // Head points up when climbing

    const animate = () => {
      if (!this.targetPosition || !this.isMoving) {
        this.stopMovement();
        return;
      }

      const dx = this.targetPosition.x - this.currentPosition.x;
      const dy = this.targetPosition.y - this.currentPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Reached target
      if (distance < this.config.speed) {
        this.currentPosition = { ...this.targetPosition };
        this.stopMovement();
        onUpdate(this.currentPosition, onLeftWall ? 'right' : 'left', rotation);
        return;
      }

      // Move towards target
      this.currentPosition.x += (dx / distance) * this.config.speed;
      this.currentPosition.y += (dy / distance) * this.config.speed;

      onUpdate(this.currentPosition, onLeftWall ? 'right' : 'left', rotation);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Fall animation - free fall with rotation
   */
  fall(onUpdate: (pos: Position, rotation: number) => void, onComplete: () => void): void {
    const groundY = this.getGroundY();
    const startY = this.currentPosition.y;
    const startTime = Date.now();
    const fallDuration = 800;  // 800ms fall time
    let rotation = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / fallDuration, 1);

      // Easing function for natural fall (accelerate)
      const easeInQuad = progress * progress;

      // Update Y position (fall down)
      this.currentPosition.y = startY + (groundY - startY) * easeInQuad;

      // Rotate during fall (2 full rotations)
      rotation = progress * 720;  // 720 degrees = 2 rotations

      onUpdate(this.currentPosition, rotation);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Landed on ground
        this.currentPosition.y = groundY;
        this.animationFrameId = null;
        onComplete();
      }
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
   * Cleanup
   */
  destroy(): void {
    this.stopMovement();
  }
}
