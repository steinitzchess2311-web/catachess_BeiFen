import type { Command, CommandContext, CommandResult } from '../types';

export const pwdCommand: Command = {
  name: 'pwd',
  aliases: ['cd.'],  // DOS style: cd without args shows current dir
  description: 'Print working directory',
  usage: 'pwd',
  handler: (ctx: CommandContext): CommandResult => {
    return { output: [ctx.cwd] };
  },
};
