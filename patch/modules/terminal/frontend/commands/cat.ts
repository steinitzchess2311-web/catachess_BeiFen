import type { Command, CommandContext, CommandResult, VirtualFileSystem } from '../types';

// Pre-defined file contents for fun
const fileContents: Record<string, string[]> = {
  'readme.txt': [
    '=================================',
    '  Welcome to CataChess Terminal',
    '=================================',
    '',
    'This is a virtual terminal emulator.',
    'Type "help" for available commands.',
    '',
    'Have fun exploring!',
  ],
  'notes.txt': [
    'TODO:',
    '- Learn more chess openings',
    '- Practice endgames',
    '- Beat the computer on hard mode',
    '',
    'Remember: Knights before Bishops!',
  ],
  '.bashrc': [
    '# ~/.bashrc: executed by bash for non-login shells',
    '',
    'export PS1="\\u@\\h:\\w\\$ "',
    'export PATH=$PATH:/usr/local/bin',
    '',
    'alias ll="ls -la"',
    'alias cls="clear"',
    '',
    '# Fortune cookie on startup',
    'echo "Welcome back, user!"',
  ],
  '.profile': [
    '# ~/.profile: executed by the command interpreter for login shells',
    '',
    'if [ -n "$BASH_VERSION" ]; then',
    '    if [ -f "$HOME/.bashrc" ]; then',
    '        . "$HOME/.bashrc"',
    '    fi',
    'fi',
  ],
  '.zshrc': [
    '# ~/.zshrc',
    '',
    'export ZSH="$HOME/.oh-my-zsh"',
    'ZSH_THEME="robbyrussell"',
    '',
    'plugins=(git node npm)',
    '',
    'source $ZSH/oh-my-zsh.sh',
  ],
  'main.c': [
    '#include <stdio.h>',
    '',
    'int main(void) {',
    '    printf("Hello, World!\\n");',
    '    return 0;',
    '}',
  ],
  'Makefile': [
    'CC = gcc',
    'CFLAGS = -Wall -Wextra',
    '',
    'all: main',
    '',
    'main: main.c',
    '\t$(CC) $(CFLAGS) -o main main.c',
    '',
    'clean:',
    '\trm -f main',
  ],
  'AUTOEXEC.BAT': [
    '@ECHO OFF',
    'PROMPT $P$G',
    'PATH C:\\DOS;C:\\WINDOWS',
    'SET TEMP=C:\\WINDOWS\\TEMP',
    'LH C:\\DOS\\DOSKEY.COM',
    'LH C:\\DOS\\MOUSE.COM',
    'ECHO.',
    'ECHO Welcome to MS-DOS!',
  ],
  'CONFIG.SYS': [
    'DEVICE=C:\\DOS\\HIMEM.SYS',
    'DEVICE=C:\\DOS\\EMM386.EXE NOEMS',
    'DOS=HIGH,UMB',
    'FILES=40',
    'BUFFERS=20',
    'STACKS=9,256',
  ],
  'WIN.INI': [
    '[windows]',
    'load=',
    'run=',
    'NullPort=None',
    '',
    '[Desktop]',
    'Wallpaper=(None)',
    'TileWallpaper=0',
    '',
    '[fonts]',
    '',
    '[extensions]',
    'txt=notepad.exe ^.txt',
  ],
  'passwd': [
    'root:x:0:0:root:/root:/bin/bash',
    'user:x:1000:1000:user:/home/user:/bin/bash',
    'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
  ],
  'hosts': [
    '127.0.0.1       localhost',
    '::1             localhost ip6-localhost ip6-loopback',
    '',
    '# The following lines are for IPv6 capable hosts',
    '::1     ip6-localhost ip6-loopback',
    'fe00::0 ip6-localnet',
  ],
};

export const catCommand: Command = {
  name: 'cat',
  aliases: ['type'],
  description: 'Display file contents',
  usage: 'cat <filename>',
  handler: (ctx: CommandContext, fs: VirtualFileSystem): CommandResult => {
    const { args, system } = ctx;
    const isDos = system === 'dos' || system === 'win95';

    if (args.length === 0) {
      return {
        output: [],
        error: isDos ? 'Required parameter missing' : 'cat: missing operand',
      };
    }

    const filename = args[0];
    const basename = filename.split(/[/\\]/).pop() || filename;

    // Check pre-defined contents
    const content = fileContents[basename] || fileContents[basename.toUpperCase()];
    if (content) {
      return { output: content };
    }

    // File exists but no content defined
    const separator = isDos ? '\\' : '/';
    const fullPath = fs.getAbsolutePath(ctx.cwd, filename, separator);

    if (fs.exists(fullPath)) {
      if (fs.isDirectory(fullPath)) {
        return {
          output: [],
          error: isDos ? 'Access denied' : `cat: ${filename}: Is a directory`,
        };
      }
      // Generic binary file message
      return {
        output: ['[Binary file - contents not displayable]'],
      };
    }

    return {
      output: [],
      error: isDos
        ? 'File not found'
        : `cat: ${filename}: No such file or directory`,
    };
  },
};

export const typeCommand: Command = {
  ...catCommand,
  name: 'type',
  aliases: ['cat'],
};
