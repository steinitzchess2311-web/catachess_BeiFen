import type { Command, CommandContext, CommandResult, VirtualFileSystem, SystemType } from '../types';
import { cdCommand } from './cd';
import { lsCommand, dirCommand } from './ls';

// Command registry
const commands: Map<string, Command> = new Map();

// Register built-in commands
function registerCommand(cmd: Command): void {
  commands.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }
}

registerCommand(cdCommand);
registerCommand(lsCommand);
registerCommand(dirCommand);

// Help command
const helpCommand: Command = {
  name: 'help',
  aliases: ['?'],
  description: 'Display available commands',
  usage: 'help [command]',
  handler: (ctx: CommandContext): CommandResult => {
    const { system, args } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      const cmd = commands.get(cmdName);
      if (cmd) {
        return {
          output: [
            `${cmd.name.toUpperCase()} - ${cmd.description}`,
            `Usage: ${cmd.usage}`,
          ],
        };
      }
      return {
        output: [],
        error: isDos ? 'Help not available for this command' : `help: no help for '${args[0]}'`,
      };
    }

    const lines: string[] = [];
    if (isDos) {
      lines.push('Available commands:');
      lines.push('');
      lines.push('  CD       Change directory');
      lines.push('  DIR      List directory contents');
      lines.push('  CLS      Clear screen');
      lines.push('  HELP     Display this help');
      lines.push('  VER      Display version');
    } else {
      lines.push('Available commands:');
      lines.push('');
      lines.push('  cd       Change directory');
      lines.push('  ls       List directory contents');
      lines.push('  clear    Clear screen');
      lines.push('  help     Display this help');
      lines.push('  uname    Display system information');
    }

    return { output: lines };
  },
};

registerCommand(helpCommand);

// Clear command
const clearCommand: Command = {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal screen',
  usage: 'clear',
  handler: (): CommandResult => {
    return { output: ['__CLEAR__'] }; // Special token handled by terminal
  },
};

registerCommand(clearCommand);

// Version/uname command
const versionCommand: Command = {
  name: 'ver',
  aliases: ['uname', 'version'],
  description: 'Display system version',
  usage: 'ver',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;

    switch (system) {
      case 'dos':
        return { output: ['MS-DOS Version 6.22'] };
      case 'win95':
        return { output: ['Microsoft Windows 95 [Version 4.00.950]'] };
      case 'linux':
        return { output: ['Linux localhost 5.15.0-generic #1 SMP x86_64 GNU/Linux'] };
      case 'mac':
        return { output: ['Darwin Mac.local 22.0.0 Darwin Kernel Version 22.0.0'] };
      default:
        return { output: ['Unknown System'] };
    }
  },
};

registerCommand(versionCommand);

// Parse command line into command, args, and flags
function parseCommandLine(input: string): { command: string; args: string[]; flags: Record<string, boolean | string> } {
  const parts = input.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase() || '';
  const args: string[] = [];
  const flags: Record<string, boolean | string> = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('--')) {
      const [key, value] = part.slice(2).split('=');
      flags[key] = value || true;
    } else if (part.startsWith('-')) {
      // Handle combined flags like -la
      for (const char of part.slice(1)) {
        flags[char] = true;
      }
    } else {
      args.push(part);
    }
  }

  return { command, args, flags };
}

// Execute a command
export function executeCommand(
  input: string,
  cwd: string,
  system: SystemType,
  fs: VirtualFileSystem
): CommandResult {
  const { command, args, flags } = parseCommandLine(input);

  if (!command) {
    return { output: [] };
  }

  const cmd = commands.get(command);
  if (!cmd) {
    const errorMsg = system === 'dos' || system === 'win95'
      ? 'Bad command or file name'
      : `${command}: command not found`;
    return { output: [], error: errorMsg };
  }

  const ctx: CommandContext = {
    cwd,
    system,
    args,
    flags,
  };

  return cmd.handler(ctx, fs);
}

export function getAvailableCommands(): Command[] {
  // Return unique commands (no aliases)
  const seen = new Set<string>();
  const result: Command[] = [];

  for (const cmd of commands.values()) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      result.push(cmd);
    }
  }

  return result;
}
