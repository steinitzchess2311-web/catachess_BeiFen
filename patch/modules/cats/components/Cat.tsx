/**
 * Cat Component - Renders sprite-based cat with multiple sprite sheets
 */

import React, { useEffect, useState, useRef } from 'react';
import type { CatState } from '../types';
import { SPRITE_CONFIGS, getSpriteSheetUrl } from '../engine/SpriteConfig';

export interface CatProps {
  animation: CatState;
  scale?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function Cat({ animation, scale = 1, direction = 'right', className = '' }: CatProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef(Date.now());
  const prevAnimation = useRef(animation);

  useEffect(() => {
    const config = SPRITE_CONFIGS[animation];

    // Reset frame when animation changes
    if (prevAnimation.current !== animation) {
      prevAnimation.current = animation;
      setCurrentFrame(0);
      lastFrameTime.current = Date.now();
    }

    // Safety check
    if (!config) {
      return;
    }

    let frameIndex = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime.current;

      if (elapsed >= config.duration) {
        lastFrameTime.current = now;
        frameIndex = (frameIndex + 1) % config.frameCount;
        setCurrentFrame(frameIndex);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animation]);

  const config = SPRITE_CONFIGS[animation];

  // Safety check
  if (!config) {
    return null;
  }

  const spriteUrl = getSpriteSheetUrl(animation);
  const safeFrameIndex = Math.min(currentFrame, config.frameCount - 1);

  const width = config.frameWidth * scale;
  const height = config.frameHeight * scale;
  const backgroundPositionX = -(safeFrameIndex * config.frameWidth * scale);

  return (
    <div
      className={`cat-sprite ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${spriteUrl})`,
        backgroundPosition: `${backgroundPositionX}px 0px`,
        backgroundSize: `${config.frameCount * config.frameWidth * scale}px ${config.frameHeight * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        transition: 'none',
      }}
    />
  );
}
