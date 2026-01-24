import React, { useRef, useState, useCallback, useEffect, MouseEvent } from 'react';
import { useTerminal } from './terminalContext';
import { Terminal } from './Terminal';
import { SystemPicker } from './SystemPicker';
import { getSystem } from './systems';

interface TerminalWindowProps {
  className?: string;
  onClose?: () => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export function TerminalWindow({ className, onClose }: TerminalWindowProps) {
  const { state, setWindowPosition, setWindowSize, toggleMaximize, toggleMinimize, toggleEffect } = useTerminal();
  const { window: windowState, terminal } = state;
  const config = getSystem(terminal.system);

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });

  // Drag handlers
  const handleTitleBarMouseDown = useCallback((e: MouseEvent) => {
    if (windowState.isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowState.position.x,
      y: e.clientY - windowState.position.y,
    });
  }, [windowState.isMaximized, windowState.position]);

  // Resize handlers
  const handleResizeMouseDown = useCallback((dir: ResizeDirection) => (e: MouseEvent) => {
    if (windowState.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    setStartMouse({ x: e.clientX, y: e.clientY });
    setInitialSize({ ...windowState.size });
    setInitialPos({ ...windowState.position });
  }, [windowState.isMaximized, windowState.size, windowState.position]);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = Math.max(0, e.clientY - dragOffset.y);
        setWindowPosition(newX, newY);
      }

      if (isResizing && resizeDir) {
        const dx = e.clientX - startMouse.x;
        const dy = e.clientY - startMouse.y;
        const minWidth = 400;
        const minHeight = 300;

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPos.x;
        let newY = initialPos.y;

        if (resizeDir.includes('e')) {
          newWidth = Math.max(minWidth, initialSize.width + dx);
        }
        if (resizeDir.includes('w')) {
          const proposedWidth = initialSize.width - dx;
          if (proposedWidth >= minWidth) {
            newWidth = proposedWidth;
            newX = initialPos.x + dx;
          }
        }
        if (resizeDir.includes('s')) {
          newHeight = Math.max(minHeight, initialSize.height + dy);
        }
        if (resizeDir.includes('n')) {
          const proposedHeight = initialSize.height - dy;
          if (proposedHeight >= minHeight) {
            newHeight = proposedHeight;
            newY = initialPos.y + dy;
          }
        }

        setWindowSize(newWidth, newHeight);
        setWindowPosition(newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDir(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDir, dragOffset, startMouse, initialSize, initialPos, setWindowPosition, setWindowSize]);

  const handleDoubleClick = useCallback(() => {
    toggleMaximize();
  }, [toggleMaximize]);

  if (!windowState.isVisible) {
    return null;
  }

  if (windowState.isMinimized) {
    return (
      <div className="terminal-window-minimized" onClick={toggleMinimize}>
        <span className="terminal-window-minimized-icon">_</span>
        <span>Terminal</span>
      </div>
    );
  }

  const windowStyle: React.CSSProperties = windowState.isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
      }
    : {
        position: 'absolute',
        top: windowState.position.y,
        left: windowState.position.x,
        width: windowState.size.width,
        height: windowState.size.height,
        zIndex: 1000,
      };

  // Determine title bar style based on system
  const isDosStyle = terminal.system === 'dos' || terminal.system === 'win95';

  return (
    <div
      ref={windowRef}
      className={`terminal-window ${isDosStyle ? 'dos-style' : 'unix-style'} ${className || ''}`}
      style={windowStyle}
    >
      {/* Title bar */}
      <div
        className="terminal-window-titlebar"
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="terminal-window-title">
          {isDosStyle ? 'MS-DOS Prompt' : 'Terminal'}
        </div>
        <div className="terminal-window-controls">
          <button
            className="terminal-window-btn minimize"
            onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
            title="Minimize"
          >
            _
          </button>
          <button
            className="terminal-window-btn maximize"
            onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
            title={windowState.isMaximized ? 'Restore' : 'Maximize'}
          >
            {windowState.isMaximized ? '❐' : '□'}
          </button>
          <button
            className="terminal-window-btn close"
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="terminal-window-toolbar">
        <SystemPicker />
        <div className="terminal-effects-toggle">
          <label>
            <input
              type="checkbox"
              checked={terminal.effects.scanlines}
              onChange={() => toggleEffect('scanlines')}
            />
            Scanlines
          </label>
          <label>
            <input
              type="checkbox"
              checked={terminal.effects.crtGlow}
              onChange={() => toggleEffect('crtGlow')}
            />
            CRT Glow
          </label>
        </div>
      </div>

      {/* Terminal content */}
      <div className="terminal-window-content">
        <Terminal />
      </div>

      {/* Resize handles */}
      {!windowState.isMaximized && (
        <>
          <div className="resize-handle n" onMouseDown={handleResizeMouseDown('n')} />
          <div className="resize-handle s" onMouseDown={handleResizeMouseDown('s')} />
          <div className="resize-handle e" onMouseDown={handleResizeMouseDown('e')} />
          <div className="resize-handle w" onMouseDown={handleResizeMouseDown('w')} />
          <div className="resize-handle ne" onMouseDown={handleResizeMouseDown('ne')} />
          <div className="resize-handle nw" onMouseDown={handleResizeMouseDown('nw')} />
          <div className="resize-handle se" onMouseDown={handleResizeMouseDown('se')} />
          <div className="resize-handle sw" onMouseDown={handleResizeMouseDown('sw')} />
        </>
      )}
    </div>
  );
}

export default TerminalWindow;
