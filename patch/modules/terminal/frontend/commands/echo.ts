import type { Command, CommandContext, CommandResult } from '../types';

export const echoCommand: Command = {
  name: 'echo',
  aliases: [],
  description: 'Display a message',
  usage: 'echo [message]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (args.length === 0) {
      // In DOS, ECHO with no args shows ECHO state
      if (isDos) {
        return { output: ['ECHO is on'] };
      }
      return { output: [''] };
    }

    const message = args.join(' ');

    // Handle special DOS echo commands
    if (isDos) {
      const upper = message.toUpperCase();
      if (upper === 'ON' || upper === 'OFF') {
        return { output: [`ECHO is ${upper.toLowerCase()}`] };
      }
      if (upper === '.') {
        return { output: [''] }; // ECHO. prints blank line
      }
    }

    return { output: [message] };
  },
};
