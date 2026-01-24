import type { Command, CommandContext, CommandResult } from '../types';

/**
 * tree command - Display directory tree
 * Returns a special token that terminalContext handles asynchronously
 */
export const treeCommand: Command = {
  name: 'tree',
  aliases: [],
  description: 'Display directory tree',
  usage: 'tree [directory]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args } = ctx;

    // Get target (optional)
    const target = args.length > 0 && !args[0].startsWith('-') ? args[0] : '';

    // Return special token for async handling
    return {
      output: [`__ASYNC_TREE__:${target}`],
    };
  },
};
