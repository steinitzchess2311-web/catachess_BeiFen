/**
 * Cat Component - Renders the sprite-based cat
 */

import React, { useEffect, useState, useRef } from 'react';
import type { CatState, SpriteFrame } from '../types';
import { SPRITE_CONFIG, ANIMATIONS, getFramePosition } from '../engine/SpriteConfig';
import spriteSheet from '../assets/cat-sprite.png';

export interface CatProps {
  animation: CatState;
  scale?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function Cat({ animation, scale = 2, direction = 'right', className = '' }: CatProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef(Date.now());

  const currentAnimation = ANIMATIONS[animation];

  useEffect(() => {
    // Reset frame when animation changes
    frameRef.current = 0;
    setCurrentFrame(0);
    lastFrameTime.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime.current;

      if (elapsed >= currentAnimation.duration) {
        lastFrameTime.current = now;

        // Move to next frame
        frameRef.current = (frameRef.current + 1) % currentAnimation.frames.length;
        setCurrentFrame(frameRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animation, currentAnimation]);

  const frame = currentAnimation.frames[currentFrame];
  const framePos = getFramePosition(frame);

  const width = SPRITE_CONFIG.frameWidth * scale;
  const height = SPRITE_CONFIG.frameHeight * scale;

  return (
    <div
      className={`cat-sprite ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `${framePos.x * scale}px ${framePos.y * scale}px`,
        backgroundSize: `${SPRITE_CONFIG.columns * SPRITE_CONFIG.frameWidth * scale}px ${SPRITE_CONFIG.rows * SPRITE_CONFIG.frameHeight * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        transition: 'transform 0.2s ease',
      }}
    />
  );
}
