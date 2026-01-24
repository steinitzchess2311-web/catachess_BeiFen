import type { Command, CommandContext, CommandResult } from '../types';

const dosLogo = [
  '    ██████╗  ██████╗ ███████╗',
  '    ██╔══██╗██╔═══██╗██╔════╝',
  '    ██║  ██║██║   ██║███████╗',
  '    ██║  ██║██║   ██║╚════██║',
  '    ██████╔╝╚██████╔╝███████║',
  '    ╚═════╝  ╚═════╝ ╚══════╝',
];

const win95Logo = [
  '    ██╗    ██╗██╗███╗   ██╗ █████╗ ███████╗',
  '    ██║    ██║██║████╗  ██║██╔══██╗██╔════╝',
  '    ██║ █╗ ██║██║██╔██╗ ██║╚██████║███████╗',
  '    ██║███╗██║██║██║╚██╗██║ ╚═══██║╚════██║',
  '    ╚███╔███╔╝██║██║ ╚████║ █████╔╝███████║',
  '     ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝',
];

const linuxLogo = [
  '        .--.         ',
  '       |o_o |        ',
  '       |:_/ |        ',
  '      //   \\ \\      ',
  '     (|     | )      ',
  '    /\'\\_   _/`\\     ',
  '    \\___)=(___/      ',
];

const macLogo = [
  '                 .:`          ',
  '                .--``--.`     ',
  '               :--------:     ',
  '              :---------:`    ',
  '              :----------:    ',
  '              :----------:    ',
  '              `:---------:    ',
  '               `:-------:`    ',
  '                 `:---:`      ',
];

export const neofetchCommand: Command = {
  name: 'neofetch',
  aliases: ['screenfetch', 'fastfetch'],
  description: 'Display system information with ASCII art',
  usage: 'neofetch',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;
    const now = new Date();
    const uptime = `${Math.floor(Math.random() * 30)} days, ${Math.floor(Math.random() * 24)} hours`;

    let logo: string[];
    let osName: string;
    let kernel: string;
    let shell: string;

    switch (system) {
      case 'dos':
        logo = dosLogo;
        osName = 'MS-DOS 6.22';
        kernel = 'DOS Kernel';
        shell = 'COMMAND.COM';
        break;
      case 'win95':
        logo = win95Logo;
        osName = 'Windows 95';
        kernel = 'Windows 4.00.950';
        shell = 'COMMAND.COM';
        break;
      case 'mac':
        logo = macLogo;
        osName = 'macOS Ventura 13.0';
        kernel = 'Darwin 22.0.0';
        shell = 'zsh 5.9';
        break;
      case 'linux':
      default:
        logo = linuxLogo;
        osName = 'Ubuntu 22.04 LTS';
        kernel = 'Linux 5.15.0-generic';
        shell = 'bash 5.1.16';
        break;
    }

    const info = [
      `user@${system === 'mac' ? 'Mac' : 'localhost'}`,
      '─'.repeat(20),
      `OS: ${osName}`,
      `Kernel: ${kernel}`,
      `Uptime: ${uptime}`,
      `Shell: ${shell}`,
      `Terminal: CataChess Terminal`,
      `CPU: Intel 486 DX2 @ 66MHz`,
      `Memory: 640K / 16384K`,
      '',
      `Date: ${now.toLocaleDateString()}`,
    ];

    // Combine logo and info side by side
    const output: string[] = [''];
    const maxLogoWidth = Math.max(...logo.map(l => l.length));

    for (let i = 0; i < Math.max(logo.length, info.length); i++) {
      const logoLine = (logo[i] || '').padEnd(maxLogoWidth + 4);
      const infoLine = info[i] || '';
      output.push(`  ${logoLine}${infoLine}`);
    }

    output.push('');

    return { output };
  },
};
