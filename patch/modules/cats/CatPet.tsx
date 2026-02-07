/**
 * CatPet - Main Desktop Pet Component
 *
 * Phase 2 Features:
 * - AI behavior system (idle, walk, sit, sleep, play)
 * - Random movement with boundaries
 * - Click interaction
 * - Smooth animations and transitions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cat } from './components/Cat';
import { BehaviorEngine } from './engine/BehaviorEngine';
import { MovementEngine } from './engine/MovementEngine';
import type { CatPetProps, Position, CatState } from './types';
import './CatPet.css';

const DEFAULT_POSITION: Position = { x: 50, y: window.innerHeight - 200 };
const DEFAULT_SCALE = 0.5;

export function CatPet({
  initialPosition = DEFAULT_POSITION,
  scale = DEFAULT_SCALE,
  enableDrag = true,
  enableAI = true,
  onInteraction,
}: CatPetProps = {}) {
  const [position, setPosition] = useState<Position>(() => ({
    x: initialPosition?.x ?? 50,
    y: initialPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight - 200 : 500),
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<CatState>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const behaviorEngine = useRef<BehaviorEngine | null>(null);
  const movementEngine = useRef<MovementEngine | null>(null);
  const isUserInteracting = useRef(false);

  // Initialize engines
  useEffect(() => {
    if (!enableAI) return;

    behaviorEngine.current = new BehaviorEngine();
    movementEngine.current = new MovementEngine(position);

    const handleStateChange = (newState: CatState) => {
      setCurrentAnimation(newState);

      if (newState === 'walk' && movementEngine.current) {
        const target = movementEngine.current.generateRandomTarget();
        movementEngine.current.moveTo(target, (pos, dir) => {
          setPosition(pos);
          setDirection(dir);
        });
      } else if (movementEngine.current) {
        movementEngine.current.stopMovement();
      }
    };

    behaviorEngine.current.start(handleStateChange);

    return () => {
      behaviorEngine.current?.destroy();
      movementEngine.current?.destroy();
    };
  }, [enableAI]);

  // Pause AI during user interaction
  useEffect(() => {
    if (isDragging || isUserInteracting.current) {
      behaviorEngine.current?.stop();
      movementEngine.current?.stopMovement();
    } else if (enableAI && behaviorEngine.current) {
      const handleStateChange = (newState: CatState) => {
        setCurrentAnimation(newState);

        if (newState === 'walk' && movementEngine.current) {
          const target = movementEngine.current.generateRandomTarget();
          movementEngine.current.moveTo(target, (pos, dir) => {
            setPosition(pos);
            setDirection(dir);
          });
        } else if (movementEngine.current) {
          movementEngine.current.stopMovement();
        }
      };

      behaviorEngine.current.start(handleStateChange);
    }
  }, [isDragging, enableAI]);

  // Mouse down - start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enableDrag) return;

      e.preventDefault();
      setIsDragging(true);
      isUserInteracting.current = true;

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }

      onInteraction?.('drag-start');
    },
    [enableDrag, onInteraction]
  );

  // Mouse move and up - dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      setPosition({ x: newX, y: newY });
      movementEngine.current?.setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      isUserInteracting.current = false;
      onInteraction?.('drag-end');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onInteraction]);

  // Click interaction
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;

      e.stopPropagation();
      isUserInteracting.current = true;

      if (behaviorEngine.current) {
        behaviorEngine.current.handleInteraction((newState) => {
          setCurrentAnimation(newState);
        });
      }

      onInteraction?.('click');

      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    },
    [isDragging, onInteraction]
  );

  return (
    <div
      ref={containerRef}
      className={`cat-pet-container ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: enableDrag ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        zIndex: 9999,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Cat animation={currentAnimation} scale={scale} direction={direction} />
    </div>
  );
}

export default CatPet;
