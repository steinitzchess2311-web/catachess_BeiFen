import type { Command, CommandContext, CommandResult } from '../types';

// 90s nostalgic commands: edit, format, deltree, ping, mem

export const editCommand: Command = {
  name: 'edit',
  aliases: ['nano', 'vim', 'vi', 'notepad'],
  description: 'Text editor (simulated)',
  usage: 'edit [filename]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (isDos) {
      return {
        output: [
          '┌────────────────────────────────────────────────────────────┐',
          '│  MS-DOS Editor                                             │',
          '├────────────────────────────────────────────────────────────┤',
          '│  File  Edit  Search  Options                        Help   │',
          '├────────────────────────────────────────────────────────────┤',
          '│                                                            │',
          '│                                                            │',
          '│     [This is a simulated editor]                           │',
          '│                                                            │',
          '│     Unfortunately, this virtual terminal                   │',
          '│     does not support interactive editing.                  │',
          '│                                                            │',
          '│     Use "cat <filename>" to view files.                    │',
          '│                                                            │',
          '│                                                            │',
          '├────────────────────────────────────────────────────────────┤',
          '│  ^X Exit    ^O Save    ^W Search    ^G Help                │',
          '└────────────────────────────────────────────────────────────┘',
        ],
      };
    }

    const editor = ctx.args[0] === 'vim' || ctx.args[0] === 'vi' ? 'Vim' : 'Nano';
    return {
      output: [
        `  ${editor} - Terminal Text Editor`,
        '',
        '  ┌──────────────────────────────────────────────┐',
        '  │                                              │',
        '  │  [Simulated editor interface]                │',
        '  │                                              │',
        '  │  This virtual terminal does not support      │',
        '  │  interactive text editing.                   │',
        '  │                                              │',
        '  │  Use "cat <filename>" to view files.         │',
        '  │                                              │',
        '  └──────────────────────────────────────────────┘',
        '',
        editor === 'Vim' ? '  :q! to rage quit' : '  ^X to exit',
      ],
    };
  },
};

export const formatCommand: Command = {
  name: 'format',
  aliases: [],
  description: 'Format a disk (simulated)',
  usage: 'format [drive]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;

    if (system !== 'dos' && system !== 'win95') {
      return {
        output: [],
        error: 'format: command not found (try mkfs on Linux)',
      };
    }

    const drive = args[0]?.toUpperCase() || 'A:';

    return {
      output: [
        `Insert new diskette for drive ${drive}`,
        'and press ENTER when ready...',
        '',
        '  ╔═══════════════════════════════════════════════╗',
        '  ║                                               ║',
        '  ║    WARNING: ALL DATA ON NON-REMOVABLE DISK    ║',
        '  ║    DRIVE C: WILL BE LOST!                     ║',
        '  ║                                               ║',
        '  ║    Proceed with Format (Y/N)?                 ║',
        '  ║                                               ║',
        '  ╚═══════════════════════════════════════════════╝',
        '',
        '  [Just kidding! This is a virtual terminal.]',
        '  [Your files are safe... for now.]',
      ],
    };
  },
};

export const deltreeCommand: Command = {
  name: 'deltree',
  aliases: ['rmdir', 'rd'],
  description: 'Delete directory tree (simulated)',
  usage: 'deltree [directory]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;

    if (system !== 'dos' && system !== 'win95') {
      return {
        output: [],
        error: 'deltree: command not found (use rm -rf on Linux... carefully!)',
      };
    }

    if (args.length === 0) {
      return {
        output: ['Required parameter missing'],
        error: 'Required parameter missing',
      };
    }

    const target = args[0].toUpperCase();

    if (target === 'C:\\' || target === 'C:\\WINDOWS') {
      return {
        output: [
          '',
          '  ╔═══════════════════════════════════════════════╗',
          '  ║                                               ║',
          '  ║    DELTREE - Delete Directory Tree            ║',
          '  ║                                               ║',
          `  ║    Delete directory "${target}"?`,
          '  ║                                               ║',
          '  ║    ████████████████████████░░░░░░  78%        ║',
          '  ║                                               ║',
          '  ║    ERROR: Access denied                       ║',
          '  ║    System files cannot be deleted             ║',
          '  ║                                               ║',
          '  ╚═══════════════════════════════════════════════╝',
          '',
          '  [Nice try! Virtual system protected.]',
        ],
      };
    }

    return {
      output: [
        `Delete directory "${target}" and all its subdirectories? [yn] y`,
        'Deleting virtual files...',
        '',
        '[This is a simulation - no actual files were harmed]',
      ],
    };
  },
};

export const pingCommand: Command = {
  name: 'ping',
  aliases: [],
  description: 'Test network connectivity (simulated)',
  usage: 'ping [host]',
  handler: (ctx: CommandContext): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';
    const host = args[0] || 'localhost';

    const lines: string[] = [];

    if (isDos) {
      lines.push(`Pinging ${host} with 32 bytes of data:`);
    } else {
      lines.push(`PING ${host} (127.0.0.1) 56(84) bytes of data.`);
    }

    lines.push('');

    // Simulate 4 ping responses
    for (let i = 0; i < 4; i++) {
      const time = Math.floor(Math.random() * 5) + 1;
      if (isDos) {
        lines.push(`Reply from 127.0.0.1: bytes=32 time=${time}ms TTL=128`);
      } else {
        lines.push(`64 bytes from 127.0.0.1: icmp_seq=${i + 1} ttl=64 time=${time}.${Math.floor(Math.random() * 100)} ms`);
      }
    }

    lines.push('');

    if (isDos) {
      lines.push('Ping statistics for 127.0.0.1:');
      lines.push('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
      lines.push('Approximate round trip times in milli-seconds:');
      lines.push('    Minimum = 1ms, Maximum = 5ms, Average = 2ms');
    } else {
      lines.push(`--- ${host} ping statistics ---`);
      lines.push('4 packets transmitted, 4 received, 0% packet loss');
      lines.push('rtt min/avg/max/mdev = 1.000/2.500/5.000/1.500 ms');
    }

    return { output: lines };
  },
};

export const memCommand: Command = {
  name: 'mem',
  aliases: ['free'],
  description: 'Display memory usage',
  usage: 'mem',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;

    if (system === 'dos' || system === 'win95') {
      return {
        output: [
          '',
          'Memory Type        Total       Used       Free',
          '----------------  --------   --------   --------',
          'Conventional         640K       423K       217K',
          'Upper                  0K         0K         0K',
          'Reserved               0K         0K         0K',
          'Extended (XMS)    15,360K    12,288K     3,072K',
          '----------------  --------   --------   --------',
          'Total memory      16,000K    12,711K     3,289K',
          '',
          'Total under 1 MB     640K       423K       217K',
          '',
          'Largest executable program size       217K (222,208 bytes)',
          'Largest free upper memory block         0K       (0 bytes)',
          'MS-DOS is resident in the high memory area.',
          '',
          '  "640K ought to be enough for anybody."',
          '                          - Probably not Bill Gates',
        ],
      };
    }

    // Linux free command style
    return {
      output: [
        '              total        used        free      shared  buff/cache   available',
        'Mem:          16384        8192        4096         256        4096        7936',
        'Swap:          4096           0        4096',
        '',
        'Note: Virtual memory simulation - not real values',
      ],
    };
  },
};

export const scandiskCommand: Command = {
  name: 'scandisk',
  aliases: ['chkdsk', 'fsck'],
  description: 'Check disk for errors (simulated)',
  usage: 'scandisk',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (isDos) {
      return {
        output: [
          'Microsoft ScanDisk',
          '',
          'ScanDisk is now checking drive C for errors.',
          '',
          '  ████████████████████████████████████ 100%',
          '',
          'ScanDisk found and fixed 0 errors.',
          '',
          'Drive C has no errors.',
          '',
          '  Total disk space:    104,857,600 bytes',
          '  Bytes in hidden files:   512,000 bytes',
          '  Bytes in system files: 2,048,000 bytes',
          '  Bytes in user files:  40,000,000 bytes',
          '  Bytes available:      62,297,600 bytes',
          '',
          '  [Virtual disk check complete]',
        ],
      };
    }

    return {
      output: [
        'fsck from util-linux 2.38',
        '/dev/sda1: clean, 42/1000000 files, 500000/4000000 blocks',
        '',
        '[Virtual filesystem check complete]',
      ],
    };
  },
};

export const defragCommand: Command = {
  name: 'defrag',
  aliases: [],
  description: 'Defragment disk (simulated)',
  usage: 'defrag',
  handler: (ctx: CommandContext): CommandResult => {
    const { system } = ctx;

    if (system !== 'dos' && system !== 'win95') {
      return {
        output: [],
        error: 'defrag: command not found (modern filesystems auto-optimize)',
      };
    }

    return {
      output: [
        'Microsoft Defragmenter',
        '',
        '  Drive C:',
        '',
        '  ░░▓▓░▓░░▓▓▓░░░▓▓░▓░░▓░░░▓▓░░░▓▓░░░▓░▓',
        '  ░▓▓░░▓░░▓░░▓▓░░▓░░▓░░▓░░░▓▓░░░▓▓░░░▓░',
        '  ░░▓▓░▓▓▓░░▓░░▓░▓░▓░░▓░▓░░░▓░░░░▓░░░░░',
        '  ░▓░░▓░░▓░▓░░▓▓░░▓░░▓░▓░░░░░░░░░░░░░░░',
        '  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
        '',
        '  Legend:  ░ = Free  ▓ = Used  ▒ = Fragmented',
        '',
        '  Defragmentation complete!',
        '  0% fragmentation remaining.',
        '',
        '  [Virtual defrag simulation complete]',
        '  [No actual disk operations performed]',
      ],
    };
  },
};
