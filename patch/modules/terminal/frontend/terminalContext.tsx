import React, { createContext, useContext, useReducer, useCallback, ReactNode, useRef, useEffect } from 'react';
import type { TerminalState, TerminalLine, SystemType, WindowState } from './types';
import { getSystem } from './systems';
import { executeCommand } from './commands';
import { virtualFS } from './filesystem';
import {
  createFolder,
  createStudy,
  deleteNode,
  getNodeChildren,
  getRootNodes,
  getNode,
  getNodePath,
  invalidatePathCache,
  type WorkspaceNode,
} from './api';

// =============================================================================
// State Types
// =============================================================================

interface PendingConfirmation {
  type: 'delete';
  target: string;
  nodeId?: string;
  message: string;
}

interface FullTerminalState {
  terminal: TerminalState;
  window: WindowState;
  pendingConfirmation: PendingConfirmation | null;
  isProcessing: boolean;
  currentNodeId: string | null; // Current directory node ID (null = root level)
  isInitialized: boolean;
}

// =============================================================================
// Actions
// =============================================================================

type TerminalAction =
  | { type: 'SET_SYSTEM'; system: SystemType }
  | { type: 'ADD_OUTPUT'; lines: TerminalLine[] }
  | { type: 'CLEAR' }
  | { type: 'NAVIGATE_HISTORY'; direction: 'up' | 'down' }
  | { type: 'ADD_COMMAND_HISTORY'; command: string }
  | { type: 'TOGGLE_EFFECT'; effect: 'scanlines' | 'sound' | 'crtGlow' }
  | { type: 'SET_BOOTING'; isBooting: boolean }
  | { type: 'SET_WINDOW_POSITION'; x: number; y: number }
  | { type: 'SET_WINDOW_SIZE'; width: number; height: number }
  | { type: 'TOGGLE_MAXIMIZE' }
  | { type: 'TOGGLE_MINIMIZE' }
  | { type: 'SET_VISIBLE'; isVisible: boolean }
  | { type: 'SET_PENDING_CONFIRMATION'; confirmation: PendingConfirmation | null }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_CURRENT_NODE'; nodeId: string | null; cwd: string }
  | { type: 'SET_INITIALIZED'; isInitialized: boolean };

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
      cwd: '/',
      username: 'user',
      hostname: 'catachess',
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
    pendingConfirmation: null,
    isProcessing: false,
    currentNodeId: null,
    isInitialized: false,
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
          cwd: '/',
          history: startupLines,
          commandHistory: [],
          commandHistoryIndex: -1,
        },
        currentNodeId: null,
        isInitialized: false,
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

    case 'ADD_COMMAND_HISTORY': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          commandHistory: [...state.terminal.commandHistory, action.command],
          commandHistoryIndex: -1,
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

    case 'SET_PENDING_CONFIRMATION': {
      return {
        ...state,
        pendingConfirmation: action.confirmation,
      };
    }

    case 'SET_PROCESSING': {
      return {
        ...state,
        isProcessing: action.isProcessing,
      };
    }

    case 'SET_CURRENT_NODE': {
      return {
        ...state,
        currentNodeId: action.nodeId,
        terminal: {
          ...state.terminal,
          cwd: action.cwd,
        },
      };
    }

    case 'SET_INITIALIZED': {
      return {
        ...state,
        isInitialized: action.isInitialized,
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
  confirmAction: (confirmed: boolean) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

// =============================================================================
// Formatting helpers
// =============================================================================

function formatDosDir(nodes: WorkspaceNode[], currentPath: string): string[] {
  const lines: string[] = [];
  const dosPath = currentPath === '/' ? 'C:\\' : `C:\\${currentPath.slice(1).replace(/\//g, '\\')}`;

  lines.push(' Volume in drive C has no label');
  lines.push(` Directory of ${dosPath}`);
  lines.push('');

  let fileCount = 0;
  let dirCount = 0;

  // Add . and .. for navigation reference
  if (currentPath !== '/') {
    lines.push('.            <DIR>        01-01-95  12:00a');
    lines.push('..           <DIR>        01-01-95  12:00a');
    dirCount += 2;
  }

  for (const node of nodes) {
    const name = node.title.toUpperCase().substring(0, 12).padEnd(12);
    if (node.node_type === 'folder' || node.node_type === 'workspace') {
      lines.push(`${name} <DIR>        01-01-95  12:00a`);
      dirCount++;
    } else {
      // Studies show as .STUDY files
      const displayName = `${node.title.substring(0, 8)}.STUDY`.padEnd(12);
      lines.push(`${displayName}      4,096  01-01-95  12:00a`);
      fileCount++;
    }
  }

  lines.push('');
  lines.push(`        ${fileCount} file(s)          ${(fileCount * 4096).toLocaleString()} bytes`);
  lines.push(`        ${dirCount} dir(s)   104,857,600 bytes free`);

  return lines;
}

function formatUnixLs(nodes: WorkspaceNode[], flags: string, currentPath: string): string[] {
  if (nodes.length === 0 && currentPath === '/') {
    return ['(empty workspace - use mkdir to create folders)'];
  }

  if (nodes.length === 0) {
    return [];
  }

  const longFormat = flags.includes('l');

  if (longFormat) {
    const lines: string[] = [];
    lines.push(`total ${nodes.length * 4}`);

    for (const node of nodes) {
      const isDir = node.node_type === 'folder' || node.node_type === 'workspace';
      const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
      const size = '4096'.padStart(8);
      const date = 'Jan  1 12:00';
      const displayName = isDir ? node.title : `${node.title}.study`;
      const name = isDir ? `\x1b[1;34m${displayName}\x1b[0m` : displayName;
      lines.push(`${perms}  1 user user ${size} ${date} ${name}`);
    }

    return lines;
  }

  // Simple format - names in a row
  const names = nodes.map(node => {
    const isDir = node.node_type === 'folder' || node.node_type === 'workspace';
    const displayName = isDir ? node.title : `${node.title}.study`;
    return isDir ? `\x1b[1;34m${displayName}\x1b[0m` : displayName;
  });

  return [names.join('  ')];
}

// =============================================================================
// Provider
// =============================================================================

interface TerminalProviderProps {
  children: ReactNode;
  initialSystem?: SystemType;
}

export function TerminalProvider({ children, initialSystem = 'dos' }: TerminalProviderProps) {
  const [state, dispatch] = useReducer(terminalReducer, createInitialState(initialSystem));
  const pendingActionRef = useRef<{ target: string; nodeId?: string } | null>(null);

  // Initialize - check root nodes exist
  useEffect(() => {
    if (state.isInitialized) return;

    const init = async () => {
      try {
        const roots = await getRootNodes();
        if (roots.length > 0) {
          // Start at root level (null nodeId means we list all root nodes)
          dispatch({ type: 'SET_CURRENT_NODE', nodeId: null, cwd: '/' });
        }
      } catch (e) {
        console.error('[terminal] Failed to initialize:', e);
      }
      dispatch({ type: 'SET_INITIALIZED', isInitialized: true });
    };

    init();
  }, [state.isInitialized]);

  const addOutput = useCallback((lines: TerminalLine[]) => {
    dispatch({ type: 'ADD_OUTPUT', lines });
  }, []);

  const addLine = useCallback((content: string, type: 'output' | 'error' | 'system' = 'output') => {
    addOutput([{
      id: generateId(),
      type,
      content,
      timestamp: Date.now(),
    }]);
  }, [addOutput]);

  // Build path string from node chain
  const buildPath = useCallback(async (nodeId: string | null): Promise<string> => {
    if (!nodeId) return '/';
    return await getNodePath(nodeId);
  }, []);

  // Handle async ls
  const handleLs = useCallback(async (target: string, flags: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    try {
      let nodes: WorkspaceNode[];
      let displayPath = state.terminal.cwd;

      if (target === '' || target === '.') {
        // List current directory
        if (state.currentNodeId === null) {
          nodes = await getRootNodes();
        } else {
          nodes = await getNodeChildren(state.currentNodeId);
        }
      } else if (target === '..') {
        // List parent directory
        if (state.currentNodeId === null) {
          nodes = await getRootNodes();
        } else {
          const currentNode = await getNode(state.currentNodeId);
          if (currentNode?.parent_id) {
            nodes = await getNodeChildren(currentNode.parent_id);
            displayPath = await buildPath(currentNode.parent_id);
          } else {
            nodes = await getRootNodes();
            displayPath = '/';
          }
        }
      } else {
        // Find target node by name in current directory
        let children: WorkspaceNode[];
        if (state.currentNodeId === null) {
          children = await getRootNodes();
        } else {
          children = await getNodeChildren(state.currentNodeId);
        }

        const targetNode = children.find(c =>
          c.title.toLowerCase() === target.toLowerCase() ||
          c.title.toLowerCase() === target.replace(/\.study$/i, '').toLowerCase()
        );

        if (!targetNode) {
          addLine(isDos
            ? 'File Not Found'
            : `ls: cannot access '${target}': No such file or directory`,
            'error'
          );
          return;
        }

        if (targetNode.node_type === 'study') {
          // Can't ls a study file, just show its info
          addLine(`${targetNode.title}.study`);
          return;
        }

        nodes = await getNodeChildren(targetNode.id);
        displayPath = await buildPath(targetNode.id);
      }

      // Format output based on system
      const output = isDos || flags === 'dos'
        ? formatDosDir(nodes, displayPath)
        : formatUnixLs(nodes, flags, displayPath);

      for (const line of output) {
        addLine(line);
      }
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to list directory'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.terminal.system, state.terminal.cwd, state.currentNodeId, addLine, buildPath]);

  // Handle async cd
  const handleCd = useCallback(async (target: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    try {
      // Go to root
      if (target === '' || target === '/' || target === '~') {
        dispatch({ type: 'SET_CURRENT_NODE', nodeId: null, cwd: '/' });
        return;
      }

      // Go to parent
      if (target === '..') {
        if (state.currentNodeId === null) {
          // Already at root
          return;
        }

        const currentNode = await getNode(state.currentNodeId);
        if (!currentNode || !currentNode.parent_id) {
          // Go to root
          dispatch({ type: 'SET_CURRENT_NODE', nodeId: null, cwd: '/' });
        } else {
          const newPath = await buildPath(currentNode.parent_id);
          dispatch({ type: 'SET_CURRENT_NODE', nodeId: currentNode.parent_id, cwd: newPath });
        }
        return;
      }

      // Find target node by name
      let children: WorkspaceNode[];
      if (state.currentNodeId === null) {
        children = await getRootNodes();
        console.log('[terminal] getRootNodes returned:', children);
      } else {
        children = await getNodeChildren(state.currentNodeId);
        console.log('[terminal] getNodeChildren returned:', children);
      }

      console.log('[terminal] Looking for target:', target);
      console.log('[terminal] Available titles:', children.map(c => c.title));

      const targetNode = children.find(c =>
        c.title.toLowerCase() === target.toLowerCase()
      );

      if (!targetNode) {
        console.log('[terminal] Target not found in children');
        addLine(isDos
          ? 'The system cannot find the path specified.'
          : `cd: ${target}: No such file or directory`,
          'error'
        );
        return;
      }

      if (targetNode.node_type === 'study') {
        addLine(isDos
          ? 'The directory name is invalid.'
          : `cd: ${target}: Not a directory`,
          'error'
        );
        return;
      }

      const newPath = await buildPath(targetNode.id);
      dispatch({ type: 'SET_CURRENT_NODE', nodeId: targetNode.id, cwd: newPath });
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to change directory'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.terminal.system, state.currentNodeId, addLine, buildPath]);

  // Handle async mkdir
  const handleMkdir = useCallback(async (dirName: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });

    try {
      const result = await createFolder(dirName, state.currentNodeId || undefined);

      if (result) {
        addLine(`Directory created: ${dirName}`);
        invalidatePathCache(state.terminal.cwd);
      } else {
        addLine(`Failed to create directory: ${dirName}`, 'error');
      }
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to create directory'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.currentNodeId, state.terminal.cwd, addLine]);

  // Handle async touch (create study)
  const handleTouch = useCallback(async (fileName: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });

    try {
      const title = fileName.replace(/\.study$/i, '');
      const result = await createStudy(title, state.currentNodeId || undefined);

      if (result) {
        addLine(`Study created: ${fileName}`);
        invalidatePathCache(state.terminal.cwd);
      } else {
        addLine(`Failed to create study: ${fileName}`, 'error');
      }
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to create study'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.currentNodeId, state.terminal.cwd, addLine]);

  // Handle delete with confirmation
  const handleDeleteConfirm = useCallback(async (target: string) => {
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    // Find the node to delete in current directory
    let children: WorkspaceNode[];
    if (state.currentNodeId === null) {
      children = await getRootNodes();
    } else {
      children = await getNodeChildren(state.currentNodeId);
    }

    const targetName = target.replace(/\.study$/i, '');
    const node = children.find(c =>
      c.title.toLowerCase() === targetName.toLowerCase()
    );

    if (!node) {
      addLine(isDos
        ? 'File Not Found'
        : `rm: cannot remove '${target}': No such file or directory`,
        'error'
      );
      return;
    }

    // Store pending action and show confirmation
    pendingActionRef.current = { target, nodeId: node.id };

    const typeLabel = node.node_type === 'folder' ? 'directory' : 'study';

    dispatch({
      type: 'SET_PENDING_CONFIRMATION',
      confirmation: {
        type: 'delete',
        target,
        nodeId: node.id,
        message: isDos
          ? `Delete ${typeLabel} "${target}"? (Y/N)`
          : `rm: remove ${typeLabel} '${target}'? (y/n)`,
      },
    });

    addLine(isDos
      ? `Delete ${typeLabel} "${target}"? (Y/N)`
      : `rm: remove ${typeLabel} '${target}'? (y/n)`,
      'system'
    );
  }, [state.terminal.system, state.currentNodeId, addLine]);

  // Handle delete force (no confirmation)
  const handleDeleteForce = useCallback(async (target: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    try {
      let children: WorkspaceNode[];
      if (state.currentNodeId === null) {
        children = await getRootNodes();
      } else {
        children = await getNodeChildren(state.currentNodeId);
      }

      const targetName = target.replace(/\.study$/i, '');
      const node = children.find(c =>
        c.title.toLowerCase() === targetName.toLowerCase()
      );

      if (!node) {
        addLine(isDos
          ? 'File Not Found'
          : `rm: cannot remove '${target}': No such file or directory`,
          'error'
        );
        return;
      }

      await deleteNode(node.id, node.version);
      addLine(`Deleted: ${target}`);
      invalidatePathCache(state.terminal.cwd);
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to delete'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.terminal.system, state.currentNodeId, state.terminal.cwd, addLine]);

  // Handle async tree
  const handleTree = useCallback(async (target: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    try {
      // Determine starting node
      let startNodeId = state.currentNodeId;
      let startPath = state.terminal.cwd;

      if (target && target !== '.') {
        // Find target node
        let children: WorkspaceNode[];
        if (state.currentNodeId === null) {
          children = await getRootNodes();
        } else {
          children = await getNodeChildren(state.currentNodeId);
        }

        const targetNode = children.find(c =>
          c.title.toLowerCase() === target.toLowerCase()
        );

        if (!targetNode) {
          addLine(isDos
            ? 'Invalid path'
            : `tree: ${target}: No such file or directory`,
            'error'
          );
          return;
        }

        if (targetNode.node_type === 'study') {
          addLine(`${targetNode.title}.study`);
          addLine('');
          addLine('0 directories');
          return;
        }

        startNodeId = targetNode.id;
        startPath = await buildPath(targetNode.id);
      }

      const lines: string[] = [];

      if (isDos) {
        lines.push('Folder PATH listing for volume C:');
        lines.push('Volume serial number is 1234-5678');
      }

      const dosPath = startPath === '/' ? 'C:\\' : `C:\\${startPath.slice(1).replace(/\//g, '\\')}`;
      lines.push(isDos ? dosPath : startPath);

      // Build tree recursively (limited depth)
      let dirCount = 0;
      const buildTree = async (nodeId: string | null, prefix: string, depth: number): Promise<void> => {
        if (depth > 3) return;

        const items = nodeId === null
          ? await getRootNodes()
          : await getNodeChildren(nodeId);

        const dirs = items.filter(n => n.node_type === 'folder' || n.node_type === 'workspace');

        for (let i = 0; i < dirs.length; i++) {
          const dir = dirs[i];
          const isLast = i === dirs.length - 1;
          const connector = isLast ? '└───' : '├───';
          const newPrefix = prefix + (isLast ? '    ' : '│   ');

          lines.push(`${prefix}${connector}${dir.title}`);
          dirCount++;

          await buildTree(dir.id, newPrefix, depth + 1);
        }
      };

      await buildTree(startNodeId, '', 0);

      lines.push('');
      lines.push(`${dirCount} directories`);

      for (const line of lines) {
        addLine(line);
      }
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to build tree'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.terminal.system, state.terminal.cwd, state.currentNodeId, addLine, buildPath]);

  // Handle async cat (show study info)
  const handleCat = useCallback(async (target: string) => {
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });
    const isDos = state.terminal.system === 'dos' || state.terminal.system === 'win95';

    try {
      // Find target node
      let children: WorkspaceNode[];
      if (state.currentNodeId === null) {
        children = await getRootNodes();
      } else {
        children = await getNodeChildren(state.currentNodeId);
      }

      const targetName = target.replace(/\.study$/i, '');
      const node = children.find(c =>
        c.title.toLowerCase() === targetName.toLowerCase()
      );

      if (!node) {
        addLine(isDos
          ? 'File not found'
          : `cat: ${target}: No such file or directory`,
          'error'
        );
        return;
      }

      if (node.node_type === 'folder' || node.node_type === 'workspace') {
        addLine(isDos
          ? 'Access denied'
          : `cat: ${target}: Is a directory`,
          'error'
        );
        return;
      }

      // Show study info
      const lines: string[] = [];
      lines.push('');
      lines.push(`  Study: ${node.title}`);
      lines.push(`  Type: Chess Study (.study)`);
      lines.push(`  ID: ${node.id}`);
      if (node.description) {
        lines.push(`  Description: ${node.description}`);
      }
      lines.push(`  Visibility: ${node.visibility}`);
      if (node.created_at) {
        lines.push(`  Created: ${new Date(node.created_at).toLocaleString()}`);
      }
      lines.push('');
      lines.push('  [Use the sidebar to open and edit this study]');
      lines.push('');

      for (const line of lines) {
        addLine(line);
      }
    } catch (e: any) {
      addLine(`Error: ${e.message || 'Failed to read file'}`, 'error');
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.terminal.system, state.currentNodeId, addLine]);

  // Confirm or cancel pending action
  const confirmAction = useCallback(async (confirmed: boolean) => {
    const pending = state.pendingConfirmation;
    if (!pending) return;

    dispatch({ type: 'SET_PENDING_CONFIRMATION', confirmation: null });

    if (!confirmed) {
      addLine('Cancelled.');
      pendingActionRef.current = null;
      return;
    }

    if (pending.type === 'delete' && pending.nodeId) {
      dispatch({ type: 'SET_PROCESSING', isProcessing: true });

      try {
        await deleteNode(pending.nodeId);
        addLine(`Deleted: ${pending.target}`);
        invalidatePathCache(state.terminal.cwd);
      } catch (e: any) {
        addLine(`Error: ${e.message || 'Failed to delete'}`, 'error');
      } finally {
        dispatch({ type: 'SET_PROCESSING', isProcessing: false });
        pendingActionRef.current = null;
      }
    }
  }, [state.pendingConfirmation, state.terminal.cwd, addLine]);

  // Main command executor
  const execCommand = useCallback(async (input: string) => {
    // If there's a pending confirmation, handle y/n
    if (state.pendingConfirmation) {
      const answer = input.trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        confirmAction(true);
      } else {
        confirmAction(false);
      }
      return;
    }

    const { terminal } = state;
    const config = getSystem(terminal.system);
    const prompt = config.prompt(terminal.cwd, terminal.username);

    // Add input line
    addOutput([{
      id: generateId(),
      type: 'input',
      content: input,
      prompt,
      timestamp: Date.now(),
    }]);

    // Add to command history
    if (input.trim()) {
      dispatch({ type: 'ADD_COMMAND_HISTORY', command: input });
    }

    // Execute the command (gets token or direct result)
    const result = await executeCommand(input, terminal.cwd, terminal.system, virtualFS);

    // Handle special async commands
    if (result.output.length === 1) {
      const output = result.output[0];

      if (output === '__CLEAR__') {
        dispatch({ type: 'CLEAR' });
        return;
      }

      if (output.startsWith('__ASYNC_LS__:')) {
        const [, target, flags] = output.split(':');
        await handleLs(target || '', flags || '');
        return;
      }

      if (output.startsWith('__ASYNC_CD__:')) {
        const target = output.replace('__ASYNC_CD__:', '');
        await handleCd(target);
        return;
      }

      if (output.startsWith('__ASYNC_MKDIR__:')) {
        const dirName = output.replace('__ASYNC_MKDIR__:', '');
        await handleMkdir(dirName);
        return;
      }

      if (output.startsWith('__ASYNC_TOUCH__:')) {
        const fileName = output.replace('__ASYNC_TOUCH__:', '');
        await handleTouch(fileName);
        return;
      }

      if (output.startsWith('__CONFIRM_RM__:')) {
        const target = output.replace('__CONFIRM_RM__:', '');
        await handleDeleteConfirm(target);
        return;
      }

      if (output.startsWith('__ASYNC_RM_FORCE__:')) {
        const target = output.replace('__ASYNC_RM_FORCE__:', '');
        await handleDeleteForce(target);
        return;
      }

      if (output.startsWith('__ASYNC_TREE__:')) {
        const target = output.replace('__ASYNC_TREE__:', '');
        await handleTree(target);
        return;
      }

      if (output.startsWith('__ASYNC_CAT__:')) {
        const target = output.replace('__ASYNC_CAT__:', '');
        await handleCat(target);
        return;
      }
    }

    // Normal output
    if (result.error) {
      addLine(result.error, 'error');
    } else {
      for (const line of result.output) {
        addLine(line, 'output');
      }
    }
  }, [
    state,
    addOutput,
    addLine,
    handleLs,
    handleCd,
    handleMkdir,
    handleTouch,
    handleDeleteConfirm,
    handleDeleteForce,
    handleTree,
    handleCat,
    confirmAction,
  ]);

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
    confirmAction,
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
