import React from 'react';
import type { TerminalLine as TerminalLineType, SystemType } from './types';
import { getSystem } from './systems';

interface TerminalLineProps {
  line: TerminalLineType;
  system: SystemType;
}

export function TerminalLine({ line, system }: TerminalLineProps) {
  const config = getSystem(system);

  // Parse ANSI color codes for display
  const parseAnsiColors = (text: string): React.ReactNode => {
    // Simple ANSI parser for directory colors
    const parts = text.split(/\x1b\[([0-9;]+)m/);
    const nodes: React.ReactNode[] = [];
    let currentStyle: React.CSSProperties = {};

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text content
        if (parts[i]) {
          nodes.push(
            <span key={i} style={currentStyle}>
              {parts[i]}
            </span>
          );
        }
      } else {
        // ANSI code
        const code = parts[i];
        if (code === '0') {
          currentStyle = {};
        } else if (code === '1;34') {
          currentStyle = { color: config.colors.directory, fontWeight: 'bold' };
        }
      }
    }

    return nodes.length > 0 ? nodes : text;
  };

  const getLineStyle = (): React.CSSProperties => {
    switch (line.type) {
      case 'error':
        return { color: config.colors.error };
      case 'system':
        return { color: config.colors.foreground, opacity: 0.9 };
      case 'input':
        return { color: config.colors.foreground };
      case 'output':
      default:
        return { color: config.colors.foreground };
    }
  };

  return (
    <div className="terminal-line" style={getLineStyle()}>
      {line.type === 'input' && line.prompt && (
        <span className="terminal-prompt" style={{ color: config.colors.prompt }}>
          {line.prompt}
        </span>
      )}
      <span className="terminal-content">
        {parseAnsiColors(line.content)}
      </span>
    </div>
  );
}

export default TerminalLine;
