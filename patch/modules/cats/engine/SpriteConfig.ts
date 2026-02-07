/**
 * Sprite Sheet Configuration
 *
 * Based on the provided sprite sheet with pixel art cat
 */

import type { Animation, SpriteFrame } from '../types';

// Sprite sheet dimensions
export const SPRITE_CONFIG = {
  frameWidth: 32,      // Width of each frame in pixels
  frameHeight: 32,     // Height of each frame in pixels
  columns: 4,          // Number of columns in the sprite sheet
  rows: 6,             // Number of rows in the sprite sheet
} as const;

/**
 * Animation definitions
 * Each animation specifies which frames to play
 */
export const ANIMATIONS: Record<string, Animation> = {
  idle: {
    name: 'idle',
    frames: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
    duration: 200, // 200ms per frame = 0.8s total for 4 frames
    loop: true,
  },
  walk: {
    name: 'walk',
    frames: [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ],
    duration: 150,
    loop: true,
  },
  sit: {
    name: 'sit',
    frames: [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
    ],
    duration: 300,
    loop: true,
  },
  sleep: {
    name: 'sleep',
    frames: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    duration: 500,
    loop: true,
  },
  play: {
    name: 'play',
    frames: [
      { row: 5, col: 0 },
      { row: 5, col: 1 },
    ],
    duration: 200,
    loop: true,
  },
} as const;

/**
 * Get background position for a specific frame
 */
export function getFramePosition(frame: SpriteFrame): { x: number; y: number } {
  return {
    x: -(frame.col * SPRITE_CONFIG.frameWidth),
    y: -(frame.row * SPRITE_CONFIG.frameHeight),
  };
}
