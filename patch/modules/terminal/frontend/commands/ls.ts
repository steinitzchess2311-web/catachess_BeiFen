import type { Command, CommandContext, CommandResult } from '../types';

/**
 * ls command - Lists real workspace nodes from backend
 * Returns a special token that terminalContext handles asynchronously
 */
export const lsCommand: Command = {
  name: 'ls',
  aliases: [],
  description: 'List directory contents',
  usage: 'ls [-la] [directory]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, flags } = ctx;

    // Get target path (optional)
    const nonFlagArgs = args.filter(a => !a.startsWith('-'));
    const target = nonFlagArgs.length > 0 ? nonFlagArgs[0] : '';

    // Pass flags for formatting
    const showAll = flags['a'] === true || flags['all'] === true;
    const longFormat = flags['l'] === true;

    // Return special token for async handling
    // Format: __ASYNC_LS__:target:flags
    const flagStr = `${showAll ? 'a' : ''}${longFormat ? 'l' : ''}`;
    return {
      output: [`__ASYNC_LS__:${target}:${flagStr}`],
    };
  },
};

/**
 * dir command - DOS/Windows style directory listing
 * Uses same async mechanism as ls
 */
export const dirCommand: Command = {
  name: 'dir',
  aliases: [],
  description: 'List directory contents (DOS style)',
  usage: 'dir [directory]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, flags } = ctx;

    const nonFlagArgs = args.filter(a => !a.startsWith('/'));
    const target = nonFlagArgs.length > 0 ? nonFlagArgs[0] : '';

    // DOS dir always shows all files in long format
    return {
      output: [`__ASYNC_LS__:${target}:dos`],
    };
  },
};
