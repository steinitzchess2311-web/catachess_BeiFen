/**
 * Behavior Engine - AI state machine for cat behaviors
 */

import type { CatState } from '../types';

export interface BehaviorConfig {
  idleDuration: [number, number];
  walkDuration: [number, number];
  sitDuration: [number, number];
  sleepDuration: [number, number];
  transitionDelay: number;
}

interface StateTransition {
  state: CatState;
  duration: number;
  timestamp: number;
}

export class BehaviorEngine {
  private currentState: CatState = 'idle';
  private stateStartTime: number = Date.now();
  private nextTransition: StateTransition | null = null;
  private timeoutId: number | null = null;
  private readonly config: BehaviorConfig;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = {
      idleDuration: config.idleDuration ?? [3000, 8000],
      walkDuration: config.walkDuration ?? [2000, 5000],
      sitDuration: config.sitDuration ?? [5000, 15000],
      sleepDuration: config.sleepDuration ?? [10000, 30000],
      transitionDelay: config.transitionDelay ?? 500,
    };
  }

  /**
   * Get current state
   */
  getState(): CatState {
    return this.currentState;
  }

  /**
   * Start autonomous behavior
   */
  start(onStateChange: (state: CatState) => void): void {
    this.scheduleNextTransition(onStateChange);
  }

  /**
   * Stop autonomous behavior
   */
  stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.nextTransition = null;
  }

  /**
   * Force transition to specific state
   */
  transitionTo(state: CatState, onStateChange: (state: CatState) => void): void {
    this.stop();
    this.currentState = state;
    this.stateStartTime = Date.now();
    onStateChange(state);
    this.scheduleNextTransition(onStateChange);
  }

  /**
   * Handle user interaction (click)
   */
  handleInteraction(onStateChange: (state: CatState) => void): void {
    if (this.currentState === 'sleep') {
      this.transitionTo('idle', onStateChange);
    } else if (this.currentState === 'idle') {
      this.transitionTo('play', onStateChange);
      setTimeout(() => this.transitionTo('idle', onStateChange), 2000);
    }
  }

  /**
   * Schedule next state transition
   */
  private scheduleNextTransition(onStateChange: (state: CatState) => void): void {
    const nextState = this.determineNextState();
    const duration = this.getStateDuration(this.currentState);

    this.timeoutId = window.setTimeout(() => {
      this.currentState = nextState;
      this.stateStartTime = Date.now();
      onStateChange(nextState);
      this.scheduleNextTransition(onStateChange);
    }, duration);
  }

  /**
   * Determine next logical state
   */
  private determineNextState(): CatState {
    const weights = this.getStateWeights();
    const random = Math.random();
    let cumulative = 0;

    for (const [state, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return state as CatState;
      }
    }

    return 'idle';
  }

  /**
   * Get state transition weights based on current state
   */
  private getStateWeights(): Record<CatState, number> {
    switch (this.currentState) {
      case 'idle':
        return { walk: 0.5, sit: 0.3, sleep: 0.15, play: 0.05, idle: 0 };
      case 'walk':
        return { idle: 0.6, sit: 0.25, sleep: 0.1, play: 0.05, walk: 0 };
      case 'sit':
        return { idle: 0.5, walk: 0.3, sleep: 0.2, play: 0, sit: 0 };
      case 'sleep':
        return { idle: 0.7, sit: 0.2, walk: 0.1, play: 0, sleep: 0 };
      case 'play':
        return { idle: 0.8, walk: 0.2, sit: 0, sleep: 0, play: 0 };
      default:
        return { idle: 1, walk: 0, sit: 0, sleep: 0, play: 0 };
    }
  }

  /**
   * Get duration for current state
   */
  private getStateDuration(state: CatState): number {
    const [min, max] =
      state === 'idle'
        ? this.config.idleDuration
        : state === 'walk'
          ? this.config.walkDuration
          : state === 'sit'
            ? this.config.sitDuration
            : state === 'sleep'
              ? this.config.sleepDuration
              : [2000, 3000];

    return min + Math.random() * (max - min);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
  }
}
