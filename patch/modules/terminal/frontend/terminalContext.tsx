import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { TerminalState, TerminalLine, SystemType, WindowState } from './types';
import { getSystem } from './systems';
import { executeCommand } from './commands';
import { virtualFS } from './filesystem';

// =============================================================================
// State Types
// =============================================================================

interface FullTerminalState {
  terminal: TerminalState;
  window: WindowState;
}

// =============================================================================
// Actions
// =============================================================================

type TerminalAction =
  | { type: 'SET_SYSTEM'; system: SystemType }
  | { type: 'EXECUTE_COMMAND'; input: string }
  | { type: 'ADD_OUTPUT'; lines: TerminalLine[] }
  | { type: 'CLEAR' }
  | { type: 'NAVIGATE_HISTORY'; direction: 'up' | 'down' }
  | { type: 'TOGGLE_EFFECT'; effect: 'scanlines' | 'sound' | 'crtGlow' }
  | { type: 'SET_BOOTING'; isBooting: boolean }
  | { type: 'SET_WINDOW_POSITION'; x: number; y: number }
  | { type: 'SET_WINDOW_SIZE'; width: number; height: number }
  | { type: 'TOGGLE_MAXIMIZE' }
  | { type: 'TOGGLE_MINIMIZE' }
  | { type: 'SET_VISIBLE'; isVisible: boolean };

// =============================================================================
// Initial State
// =============================================================================

function createInitialState(system: SystemType = 'dos'): FullTerminalState {
  const config = getSystem(system);
  const startupLines: TerminalLine[] = config.startupMessages.map((msg, i) => ({
    id: `startup-${i}`,
    type: 'system',
    content: msg,
    timestamp: Date.now(),
  }));

  return {
    terminal: {
      system,
      cwd: config.homePath,
      username: 'user',
      hostname: 'localhost',
      history: startupLines,
      commandHistory: [],
      commandHistoryIndex: -1,
      isBooting: false,
      effects: {
        scanlines: true,
        sound: false,
        crtGlow: true,
      },
    },
    window: {
      position: { x: 100, y: 100 },
      size: { width: 680, height: 480 },
      isMaximized: false,
      isMinimized: false,
      isVisible: true,
    },
  };
}

// =============================================================================
// Reducer
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function terminalReducer(state: FullTerminalState, action: TerminalAction): FullTerminalState {
  switch (action.type) {
    case 'SET_SYSTEM': {
      const config = getSystem(action.system);
      const startupLines: TerminalLine[] = config.startupMessages.map((msg, i) => ({
        id: `startup-${i}-${Date.now()}`,
        type: 'system',
        content: msg,
        timestamp: Date.now(),
      }));

      return {
        ...state,
        terminal: {
          ...state.terminal,
          system: action.system,
          cwd: config.homePath,
          history: startupLines,
          commandHistory: [],
          commandHistoryIndex: -1,
        },
      };
    }

    case 'EXECUTE_COMMAND': {
      const { input } = action;
      const { terminal } = state;
      const config = getSystem(terminal.system);
      const prompt = config.prompt(terminal.cwd, terminal.username);

      // Add the input line to history
      const inputLine: TerminalLine = {
        id: generateId(),
        type: 'input',
        content: input,
        prompt,
        timestamp: Date.now(),
      };

      // Execute the command
      const result = executeCommand(input, terminal.cwd, terminal.system, virtualFS);

      // Handle clear command
      if (result.output.length === 1 && result.output[0] === '__CLEAR__') {
        return {
          ...state,
          terminal: {
            ...terminal,
            history: [],
            commandHistory: [...terminal.commandHistory, input],
            commandHistoryIndex: -1,
          },
        };
      }

      // Build output lines
      const outputLines: TerminalLine[] = [];

      if (result.error) {
        outputLines.push({
          id: generateId(),
          type: 'error',
          content: result.error,
          timestamp: Date.now(),
        });
      } else {
        for (const line of result.output) {
          outputLines.push({
            id: generateId(),
            type: 'output',
            content: line,
            timestamp: Date.now(),
          });
        }
      }

      return {
        ...state,
        terminal: {
          ...terminal,
          cwd: result.newCwd || terminal.cwd,
          history: [...terminal.history, inputLine, ...outputLines],
          commandHistory: input.trim() ? [...terminal.commandHistory, input] : terminal.commandHistory,
          commandHistoryIndex: -1,
        },
      };
    }

    case 'ADD_OUTPUT': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          history: [...state.terminal.history, ...action.lines],
        },
      };
    }

    case 'CLEAR': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          history: [],
        },
      };
    }

    case 'NAVIGATE_HISTORY': {
      const { commandHistory, commandHistoryIndex } = state.terminal;
      if (commandHistory.length === 0) return state;

      let newIndex: number;
      if (action.direction === 'up') {
        newIndex = commandHistoryIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, commandHistoryIndex - 1);
      } else {
        newIndex = commandHistoryIndex === -1
          ? -1
          : commandHistoryIndex >= commandHistory.length - 1
            ? -1
            : commandHistoryIndex + 1;
      }

      return {
        ...state,
        terminal: {
          ...state.terminal,
          commandHistoryIndex: newIndex,
        },
      };
    }

    case 'TOGGLE_EFFECT': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          effects: {
            ...state.terminal.effects,
            [action.effect]: !state.terminal.effects[action.effect],
          },
        },
      };
    }

    case 'SET_BOOTING': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          isBooting: action.isBooting,
        },
      };
    }

    case 'SET_WINDOW_POSITION': {
      return {
        ...state,
        window: {
          ...state.window,
          position: { x: action.x, y: action.y },
        },
      };
    }

    case 'SET_WINDOW_SIZE': {
      return {
        ...state,
        window: {
          ...state.window,
          size: { width: action.width, height: action.height },
        },
      };
    }

    case 'TOGGLE_MAXIMIZE': {
      return {
        ...state,
        window: {
          ...state.window,
          isMaximized: !state.window.isMaximized,
        },
      };
    }

    case 'TOGGLE_MINIMIZE': {
      return {
        ...state,
        window: {
          ...state.window,
          isMinimized: !state.window.isMinimized,
        },
      };
    }

    case 'SET_VISIBLE': {
      return {
        ...state,
        window: {
          ...state.window,
          isVisible: action.isVisible,
        },
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface TerminalContextValue {
  state: FullTerminalState;
  executeCommand: (input: string) => void;
  setSystem: (system: SystemType) => void;
  clear: () => void;
  navigateHistory: (direction: 'up' | 'down') => void;
  toggleEffect: (effect: 'scanlines' | 'sound' | 'crtGlow') => void;
  setWindowPosition: (x: number, y: number) => void;
  setWindowSize: (width: number, height: number) => void;
  toggleMaximize: () => void;
  toggleMinimize: () => void;
  setVisible: (isVisible: boolean) => void;
  getHistoryCommand: () => string | null;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface TerminalProviderProps {
  children: ReactNode;
  initialSystem?: SystemType;
}

export function TerminalProvider({ children, initialSystem = 'dos' }: TerminalProviderProps) {
  const [state, dispatch] = useReducer(terminalReducer, createInitialState(initialSystem));

  const execCommand = useCallback((input: string) => {
    dispatch({ type: 'EXECUTE_COMMAND', input });
  }, []);

  const setSystem = useCallback((system: SystemType) => {
    dispatch({ type: 'SET_SYSTEM', system });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    dispatch({ type: 'NAVIGATE_HISTORY', direction });
  }, []);

  const toggleEffect = useCallback((effect: 'scanlines' | 'sound' | 'crtGlow') => {
    dispatch({ type: 'TOGGLE_EFFECT', effect });
  }, []);

  const setWindowPosition = useCallback((x: number, y: number) => {
    dispatch({ type: 'SET_WINDOW_POSITION', x, y });
  }, []);

  const setWindowSize = useCallback((width: number, height: number) => {
    dispatch({ type: 'SET_WINDOW_SIZE', width, height });
  }, []);

  const toggleMaximize = useCallback(() => {
    dispatch({ type: 'TOGGLE_MAXIMIZE' });
  }, []);

  const toggleMinimize = useCallback(() => {
    dispatch({ type: 'TOGGLE_MINIMIZE' });
  }, []);

  const setVisible = useCallback((isVisible: boolean) => {
    dispatch({ type: 'SET_VISIBLE', isVisible });
  }, []);

  const getHistoryCommand = useCallback((): string | null => {
    const { commandHistory, commandHistoryIndex } = state.terminal;
    if (commandHistoryIndex === -1 || commandHistory.length === 0) {
      return null;
    }
    return commandHistory[commandHistoryIndex] || null;
  }, [state.terminal]);

  const value: TerminalContextValue = {
    state,
    executeCommand: execCommand,
    setSystem,
    clear,
    navigateHistory,
    toggleEffect,
    setWindowPosition,
    setWindowSize,
    toggleMaximize,
    toggleMinimize,
    setVisible,
    getHistoryCommand,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useTerminal(): TerminalContextValue {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}

export default TerminalContext;
