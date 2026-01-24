import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useTerminal } from './terminalContext';
import { TerminalLine } from './TerminalLine';
import { getSystem } from './systems';

interface TerminalProps {
  className?: string;
}

export function Terminal({ className }: TerminalProps) {
  const { state, executeCommand, navigateHistory, getHistoryCommand } = useTerminal();
  const { terminal } = state;
  const config = getSystem(terminal.system);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminal.history]);

  // Focus input on click
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle history navigation
  useEffect(() => {
    const historyCmd = getHistoryCommand();
    if (historyCmd !== null) {
      setInput(historyCmd);
    }
  }, [terminal.commandHistoryIndex, getHistoryCommand]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input.trim()) {
          executeCommand(input);
        } else {
          // Empty enter - just show new prompt
          executeCommand('');
        }
        setInput('');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateHistory('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHistory('down');
      } else if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        setInput('');
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        executeCommand('clear');
        setInput('');
      }
    },
    [input, executeCommand, navigateHistory]
  );

  const prompt = config.prompt(terminal.cwd, terminal.username);

  const terminalStyle: React.CSSProperties = {
    backgroundColor: config.colors.background,
    color: config.colors.foreground,
    fontFamily: config.font,
  };

  return (
    <div
      className={`terminal ${className || ''}`}
      style={terminalStyle}
      onClick={handleContainerClick}
    >
      {/* Scanline overlay */}
      {terminal.effects.scanlines && <div className="terminal-scanlines" />}

      {/* CRT glow effect */}
      {terminal.effects.crtGlow && <div className="terminal-crt-glow" />}

      {/* Terminal content */}
      <div className="terminal-scroll" ref={scrollRef}>
        {/* History */}
        {terminal.history.map((line) => (
          <TerminalLine key={line.id} line={line} system={terminal.system} />
        ))}

        {/* Current input line */}
        <div className="terminal-input-line">
          <span className="terminal-prompt" style={{ color: config.colors.prompt }}>
            {prompt}
          </span>
          <span className="terminal-input-text">{input}</span>
          <span
            className={`terminal-cursor ${cursorVisible ? 'visible' : ''}`}
            style={{ backgroundColor: config.colors.foreground }}
          />
          <input
            ref={inputRef}
            type="text"
            className="terminal-hidden-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}

export default Terminal;
