import type { Command, CommandContext, CommandResult } from '../types';

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

function createCow(message: string): string[] {
  const maxWidth = 40;
  const lines = wrapText(message, maxWidth);
  const width = Math.max(...lines.map(l => l.length));

  const output: string[] = [];

  // Top border
  output.push(' ' + '_'.repeat(width + 2));

  // Message lines
  if (lines.length === 1) {
    output.push(`< ${lines[0].padEnd(width)} >`);
  } else {
    lines.forEach((line, i) => {
      const padded = line.padEnd(width);
      if (i === 0) {
        output.push(`/ ${padded} \\`);
      } else if (i === lines.length - 1) {
        output.push(`\\ ${padded} /`);
      } else {
        output.push(`| ${padded} |`);
      }
    });
  }

  // Bottom border
  output.push(' ' + '-'.repeat(width + 2));

  // The cow
  output.push('        \\   ^__^');
  output.push('         \\  (oo)\\_______');
  output.push('            (__)\\       )\\/\\');
  output.push('                ||----w |');
  output.push('                ||     ||');

  return output;
}

export const cowsayCommand: Command = {
  name: 'cowsay',
  aliases: [],
  description: 'Generate an ASCII cow with a message',
  usage: 'cowsay <message>',
  handler: (ctx: CommandContext): CommandResult => {
    const { args } = ctx;

    if (args.length === 0) {
      return { output: createCow('Moo!') };
    }

    const message = args.join(' ');
    return { output: createCow(message) };
  },
};

export const cowthinkCommand: Command = {
  name: 'cowthink',
  aliases: [],
  description: 'Generate an ASCII cow thinking',
  usage: 'cowthink <message>',
  handler: (ctx: CommandContext): CommandResult => {
    const { args } = ctx;
    const message = args.length === 0 ? 'Hmm...' : args.join(' ');

    const output = createCow(message);
    // Replace speech bubble with thought bubble
    return {
      output: output.map(line =>
        line.replace(/\\/g, 'o').replace('< ', '( ').replace(' >', ' )')
      ),
    };
  },
};
