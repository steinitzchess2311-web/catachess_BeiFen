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
  animated: boolean;
}

/**
 * Configuration for each animation state
 * Each animation uses its own sprite sheet with specific dimensions
 */
export const SPRITE_CONFIGS: Record<CatState, SpriteSheetConfig> = {
  idle: {
    fileName: 'idle.png',
    frameCount: 1,
    frameWidth: 244,
    frameHeight: 242,
    duration: 200,
    animated: false,
  },
  walk: {
    fileName: 'walk.png',
    frameCount: 3,
    frameWidth: 258,
    frameHeight: 240,
    duration: 150,
    animated: true,
  },
  sit: {
    fileName: 'idle.png',
    frameCount: 1,
    frameWidth: 244,
    frameHeight: 242,
    duration: 300,
    animated: false,
  },
  sleep: {
    fileName: 'rest.png',
    frameCount: 2,
    frameWidth: 386,
    frameHeight: 212,
    duration: 500,
    animated: true,
  },
  play: {
    fileName: 'walk.png',
    frameCount: 3,
    frameWidth: 258,
    frameHeight: 240,
    duration: 200,
    animated: true,
  },
};

/**
 * Get sprite sheet URL for a given animation
 */
export function getSpriteSheetUrl(animation: CatState): string {
  const config = SPRITE_CONFIGS[animation];
  return new URL(`../assets/${config.fileName}`, import.meta.url).href;
}
