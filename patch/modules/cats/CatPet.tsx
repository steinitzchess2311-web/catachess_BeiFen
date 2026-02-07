/**
 * CatPet - Main Desktop Pet Component
 *
 * Features:
 * - Draggable cat sprite
 * - Animated idle state
 * - Self-contained in patch/modules/cats
 */

import React, { useState, useRef, useEffect } from 'react';
import { Cat } from './components/Cat';
import type { CatPetProps, Position, CatState } from './types';
import './CatPet.css';

const DEFAULT_POSITION: Position = { x: 100, y: 100 };
const DEFAULT_SCALE = 2;

export function CatPet({
  initialPosition = DEFAULT_POSITION,
  scale = DEFAULT_SCALE,
  enableDrag = true,
  onInteraction,
}: CatPetProps = {}) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<CatState>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    if (onInteraction) {
      onInteraction('drag-start');
    }
  };

  // Handle mouse move - dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onInteraction) {
        onInteraction('drag-end');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onInteraction]);

  // Handle click
  const handleClick = () => {
    if (onInteraction) {
      onInteraction('click');
    }
    console.log('[CAT PET] Meow! 🐱');
  };

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
