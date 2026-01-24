import type { Command, CommandContext, CommandResult } from '../types';

/**
 * cat command - Show file/study info
 * For studies, shows study metadata. Returns token for async handling.
 */
export const catCommand: Command = {
  name: 'cat',
  aliases: [],
  description: 'Display file/study info',
  usage: 'cat <filename>',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (args.length === 0) {
      return {
        output: [],
        error: isDos ? 'Required parameter missing' : 'cat: missing operand',
      };
    }

    const filename = args[0];

    // Return special token for async handling
    return {
      output: [`__ASYNC_CAT__:${filename}`],
    };
  },
};

export const typeCommand: Command = {
  name: 'type',
  aliases: [],
  description: 'Display file/study info (DOS)',
  usage: 'type <filename>',
  handler: catCommand.handler,
};
