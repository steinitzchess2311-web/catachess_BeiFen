/**
 * Cat Pet System - Type Definitions
 */

export type CatState = 'idle' | 'walk' | 'sit' | 'sleep' | 'play' | 'fall' | 'climb';

export interface Position {
  x: number;
  y: number;
}

export interface SpriteFrame {
  row: number;
  col: number;
}

export interface Animation {
  name: CatState;
  frames: SpriteFrame[];
  duration: number; // milliseconds per frame
  loop: boolean;
}

export interface CatPetProps {
  initialPosition?: Position;
  scale?: number;
  enableDrag?: boolean;
  enableAI?: boolean;
  onInteraction?: (type: string) => void;
}

export interface CatPetState {
  position: Position;
  currentAnimation: CatState;
  currentFrame: number;
  isDragging: boolean;
  direction: 'left' | 'right';
}
