// Terminal Module - Frontend Barrel Exports

// Components
export { Terminal } from './Terminal';
export { TerminalWindow } from './TerminalWindow';
export { TerminalLine } from './TerminalLine';
export { SystemPicker } from './SystemPicker';

// Context
export { TerminalProvider, useTerminal } from './terminalContext';

// Systems
export { getSystem, getSystemList, systems } from './systems';
export { dosSystem } from './systems/dos';
export { win95System } from './systems/win95';
export { linuxSystem } from './systems/linux';
export { macSystem } from './systems/mac';

// Filesystem
export { virtualFS, createVirtualFileSystem } from './filesystem';

// Commands
export { executeCommand, getAvailableCommands } from './commands';

// Types
export type {
  SystemType,
  SystemConfig,
  TerminalState,
  TerminalLine as TerminalLineType,
  WindowState,
  WindowPosition,
  WindowSize,
  VirtualFile,
  VirtualDirectory,
  VirtualFileSystem,
  Command,
  CommandContext,
  CommandResult,
  CommandHandler,
} from './types';

// Styles (side-effect import)
import './styles.css';
