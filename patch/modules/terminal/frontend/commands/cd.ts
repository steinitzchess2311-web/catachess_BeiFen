import type { Command, CommandContext, CommandResult, VirtualFileSystem } from '../types';

export const cdCommand: Command = {
  name: 'cd',
  aliases: ['chdir'],
  description: 'Change the current directory',
  usage: 'cd [directory]',
  handler: (ctx: CommandContext, fs: VirtualFileSystem): CommandResult => {
    const { cwd, system, args } = ctx;
    const separator = system === 'dos' || system === 'win95' ? '\\' : '/';

    // No argument - go to home
    if (args.length === 0) {
      const homePath = system === 'dos' || system === 'win95'
        ? 'C:\\'
        : system === 'mac'
          ? '/Users/user'
          : '/home/user';
      return { output: [], newCwd: homePath };
    }

    const target = args[0];

    // Handle special cases
    if (target === '~') {
      const homePath = system === 'mac' ? '/Users/user' : '/home/user';
      return { output: [], newCwd: homePath };
    }

    // Resolve the path
    const newPath = fs.getAbsolutePath(cwd, target, separator);

    // Check if directory exists
    if (!fs.isDirectory(newPath)) {
      const errorMsg = system === 'dos' || system === 'win95'
        ? 'The system cannot find the path specified.'
        : `cd: ${target}: No such file or directory`;
      return { output: [], error: errorMsg };
    }

    return { output: [], newCwd: newPath };
  },
};
