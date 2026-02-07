/**
 * Sprite Configuration - Multiple sprite sheets with different dimensions
 */

import type { CatState } from '../types';

export interface SpriteSheetConfig {
  fileName: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  duration: number;
}

/**
 * Configuration for each animation state
 * Each animation uses its own sprite sheet with specific dimensions
 */
export const SPRITE_CONFIGS: Record<CatState, SpriteSheetConfig> = {
  idle: {
    fileName: 'idle.png',
    frameCount: 3,
    frameWidth: 244,
    frameHeight: 242,
    duration: 200,
  },
  walk: {
    fileName: 'walk.png',
    frameCount: 3,
    frameWidth: 258,
    frameHeight: 240,
    duration: 150,
  },
  sit: {
    fileName: 'idle.png', // Reuse idle for sit
    frameCount: 3,
    frameWidth: 244,
    frameHeight: 242,
    duration: 300,
  },
  sleep: {
    fileName: 'rest.png',
    frameCount: 2,
    frameWidth: 386,
    frameHeight: 212,
    duration: 500,
  },
  play: {
    fileName: 'walk.png', // Reuse walk for play
    frameCount: 3,
    frameWidth: 258,
    frameHeight: 240,
    duration: 200,
  },
};

/**
 * Get sprite sheet URL for a given animation
 */
export function getSpriteSheetUrl(animation: CatState): string {
  const config = SPRITE_CONFIGS[animation];
  return new URL(`../assets/${config.fileName}`, import.meta.url).href;
}
