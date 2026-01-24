/**
 * Terminal Module Types
 */

// =============================================================================
// System Types
// =============================================================================

export type SystemType = 'dos' | 'win95' | 'linux' | 'mac';

export interface SystemConfig {
  id: SystemType;
  name: string;
  prompt: (cwd: string, username?: string) => string;
  pathSeparator: '/' | '\\';
  rootPath: string;
  homePath: string;
  colors: {
    background: string;
    foreground: string;
    prompt: string;
    error: string;
    directory: string;
  };
  font: string;
  startupMessages: string[];
  errorMessages: {
    notFound: string;
    notDirectory: string;
    invalidPath: string;
  };
}

// =============================================================================
// Virtual Filesystem Types
// =============================================================================

export interface VirtualFile {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  content?: string;
}

export interface VirtualDirectory {
  [name: string]: VirtualFile;
}

// =============================================================================
// Terminal State Types
// =============================================================================

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  prompt?: string;
  timestamp: number;
}

export interface TerminalState {
  system: SystemType;
  cwd: string;
  username: string;
  hostname: string;
  history: TerminalLine[];
  commandHistory: string[];
  commandHistoryIndex: number;
  isBooting: boolean;
  effects: {
    scanlines: boolean;
    sound: boolean;
    crtGlow: boolean;
  };
}

// =============================================================================
// Command Types
// =============================================================================

export interface CommandContext {
  cwd: string;
  system: SystemType;
  args: string[];
  flags: Record<string, boolean | string>;
}

export interface CommandResult {
  output: string[];
  newCwd?: string;
  error?: string;
}

export type CommandHandler = (ctx: CommandContext, fs: VirtualFileSystem) => CommandResult;

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  handler: CommandHandler;
}

// =============================================================================
// Virtual File System Interface
// =============================================================================

export interface VirtualFileSystem {
  listDirectory: (path: string) => VirtualFile[] | null;
  exists: (path: string) => boolean;
  isDirectory: (path: string) => boolean;
  resolvePath: (cwd: string, target: string, separator: '/' | '\\') => string;
  getAbsolutePath: (cwd: string, target: string, separator: '/' | '\\') => string;
}

// =============================================================================
// Window Types
// =============================================================================

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  position: WindowPosition;
  size: WindowSize;
  isMaximized: boolean;
  isMinimized: boolean;
  isVisible: boolean;
}
