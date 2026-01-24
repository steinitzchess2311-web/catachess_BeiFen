import type { Command, CommandContext, CommandResult } from '../types';

// Note: This command needs access to command history from context
// We'll store a reference that gets updated by the terminal

let commandHistoryRef: string[] = [];

export function setCommandHistoryRef(history: string[]): void {
  commandHistoryRef = history;
}

export const historyCommand: Command = {
  name: 'history',
  aliases: [],
  description: 'Display command history',
  usage: 'history',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (commandHistoryRef.length === 0) {
      return {
        output: isDos ? ['No commands in history'] : [],
      };
    }

    const lines = commandHistoryRef.map((cmd, i) => {
      const num = String(i + 1).padStart(4, ' ');
      return `${num}  ${cmd}`;
    });

    return { output: lines };
  },
};

export const dosKeyCommand: Command = {
  name: 'doskey',
  aliases: [],
  description: 'Display command history (DOS)',
  usage: 'doskey /history',
  handler: (ctx: CommandContext): CommandResult => {
    if (ctx.flags['history'] || ctx.args.includes('/HISTORY') || ctx.args.includes('/history')) {
      return historyCommand.handler(ctx, {} as any);
    }

    return {
      output: ['DOSKEY installed.'],
    };
  },
};
