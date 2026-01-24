import type { Command, CommandContext, CommandResult } from '../types';

// Color command - shows available colors
// Actual color changing is handled by the terminal context

const colorSchemes = {
  dos: {
    name: 'DOS Green',
    bg: '#000000',
    fg: '#00ff00',
  },
  amber: {
    name: 'Amber Monitor',
    bg: '#000000',
    fg: '#ffb000',
  },
  white: {
    name: 'White on Black',
    bg: '#000000',
    fg: '#ffffff',
  },
  blue: {
    name: 'Blue Screen',
    bg: '#0000aa',
    fg: '#ffffff',
  },
  matrix: {
    name: 'Matrix Green',
    bg: '#0d0208',
    fg: '#00ff41',
  },
  ubuntu: {
    name: 'Ubuntu',
    bg: '#300a24',
    fg: '#ffffff',
  },
};

export const colorCommand: Command = {
  name: 'color',
  aliases: ['theme'],
  description: 'Display or change terminal colors',
  usage: 'color [scheme]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (args.length === 0) {
      const lines: string[] = [
        isDos ? 'Available color schemes:' : 'Available color schemes:',
        '',
      ];

      for (const [key, scheme] of Object.entries(colorSchemes)) {
        lines.push(`  ${key.padEnd(10)} - ${scheme.name}`);
      }

      lines.push('');
      lines.push(isDos
        ? 'Usage: COLOR <scheme>'
        : 'Usage: color <scheme>'
      );

      return { output: lines };
    }

    const scheme = args[0].toLowerCase();
    if (scheme in colorSchemes) {
      // Return special token for terminal to handle
      return {
        output: [`__COLOR__:${scheme}`],
      };
    }

    return {
      output: [],
      error: isDos
        ? `Invalid color scheme: ${args[0]}`
        : `color: unknown scheme '${args[0]}'`,
    };
  },
};
