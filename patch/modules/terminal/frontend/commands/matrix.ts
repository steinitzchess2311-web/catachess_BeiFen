import type { Command, CommandContext, CommandResult } from '../types';

// Matrix rain effect - returns ASCII art representation
function generateMatrixFrame(): string[] {
  const width = 60;
  const height = 15;
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';

  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');

  for (let y = 0; y < height; y++) {
    let line = '  ║';
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.1) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        // Simulate different brightness with spacing
        if (Math.random() < 0.3) {
          line += char;
        } else {
          line += ' ';
        }
      } else {
        line += ' ';
      }
    }
    line += '║';
    lines.push(line);
  }

  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  "Wake up, Neo..."');
  lines.push('  "The Matrix has you..."');
  lines.push('  "Follow the white rabbit."');
  lines.push('');
  lines.push('  [Press any key to exit the Matrix]');

  return lines;
}

export const matrixCommand: Command = {
  name: 'matrix',
  aliases: ['cmatrix'],
  description: 'Display The Matrix digital rain effect',
  usage: 'matrix',
  handler: (_ctx: CommandContext): CommandResult => {
    return { output: generateMatrixFrame() };
  },
};
