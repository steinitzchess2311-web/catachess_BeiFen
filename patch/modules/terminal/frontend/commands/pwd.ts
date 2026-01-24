import type { Command, CommandContext, CommandResult } from '../types';

/**
 * pwd command - Print working directory
 * Simply returns the current cwd which is now maintained by terminalContext
 * based on real node paths
 */
export const pwdCommand: Command = {
  name: 'pwd',
  aliases: ['cd.'],  // DOS style: cd without args shows current dir
  description: 'Print working directory',
  usage: 'pwd',
  handler: (ctx: CommandContext): CommandResult => {
    // cwd is now the real path built from node chain
    return { output: [ctx.cwd || '/'] };
  },
};
