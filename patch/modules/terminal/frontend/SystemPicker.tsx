import React from 'react';
import { useTerminal } from './terminalContext';
import { getSystemList } from './systems';
import type { SystemType } from './types';

interface SystemPickerProps {
  className?: string;
}

export function SystemPicker({ className }: SystemPickerProps) {
  const { state, setSystem } = useTerminal();
  const systems = getSystemList();
  const currentSystem = state.terminal.system;

  return (
    <div className={`system-picker ${className || ''}`}>
      <label className="system-picker-label">System:</label>
      <select
        className="system-picker-select"
        value={currentSystem}
        onChange={(e) => setSystem(e.target.value as SystemType)}
      >
        {systems.map((sys) => (
          <option key={sys.id} value={sys.id}>
            {sys.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SystemPicker;
