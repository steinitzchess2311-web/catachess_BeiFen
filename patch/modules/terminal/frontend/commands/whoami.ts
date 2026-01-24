import type { Command, CommandContext, CommandResult } from '../types';

export const whoamiCommand: Command = {
  name: 'whoami',
  aliases: [],
  description: 'Display current user name',
  usage: 'whoami',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;

    switch (system) {
      case 'dos':
      case 'win95':
        return { output: ['USER'] };
      case 'mac':
        return { output: ['user'] };
      case 'linux':
      default:
        return { output: ['user'] };
    }
  },
};

export const hostnameCommand: Command = {
  name: 'hostname',
  aliases: [],
  description: 'Display system hostname',
  usage: 'hostname',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;

    switch (system) {
      case 'dos':
      case 'win95':
        return { output: ['WORKSTATION'] };
      case 'mac':
        return { output: ['Mac.local'] };
      case 'linux':
      default:
        return { output: ['localhost'] };
    }
  },
};
