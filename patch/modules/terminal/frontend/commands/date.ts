import type { Command, CommandContext, CommandResult } from '../types';

export const dateCommand: Command = {
  name: 'date',
  aliases: [],
  description: 'Display current date and time',
  usage: 'date',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;
    const now = new Date();

    if (system === 'dos' || system === 'win95') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[now.getDay()];
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const year = now.getFullYear();
      return {
        output: [
          `Current date is ${day} ${month}-${date}-${year}`,
        ],
      };
    }

    // Unix style
    return {
      output: [now.toString()],
    };
  },
};

export const timeCommand: Command = {
  name: 'time',
  aliases: [],
  description: 'Display current time',
  usage: 'time',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;
    const now = new Date();

    if (system === 'dos' || system === 'win95') {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const hundredths = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      return {
        output: [
          `Current time is ${hours}:${minutes}:${seconds}.${hundredths}`,
        ],
      };
    }

    // For Unix, time usually runs a command and reports time taken
    // We'll just show the current time
    return {
      output: [now.toLocaleTimeString()],
    };
  },
};
