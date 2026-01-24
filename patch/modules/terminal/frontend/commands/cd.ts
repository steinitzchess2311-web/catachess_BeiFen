import type { Command, CommandContext, CommandResult } from '../types';

/**
 * cd command - Changes directory using real workspace nodes
 * Returns a special token that terminalContext handles asynchronously
 */
export const cdCommand: Command = {
  name: 'cd',
  aliases: ['chdir'],
  description: 'Change the current directory',
  usage: 'cd [directory]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args } = ctx;

    // No argument - go to root
    if (args.length === 0) {
      return {
        output: ['__ASYNC_CD__:'],
      };
    }

    const target = args[0];

    // Handle ~ as root
    if (target === '~') {
      return {
        output: ['__ASYNC_CD__:'],
      };
    }

    // Return special token for async handling
    // Format: __ASYNC_CD__:target
    return {
      output: [`__ASYNC_CD__:${target}`],
    };
  },
};
