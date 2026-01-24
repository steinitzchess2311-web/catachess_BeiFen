import type { Command, CommandContext, CommandResult, VirtualFileSystem } from '../types';

export const treeCommand: Command = {
  name: 'tree',
  aliases: [],
  description: 'Display directory tree',
  usage: 'tree [directory]',
  handler: (ctx: CommandContext, fs: VirtualFileSystem): CommandResult => {
    const { cwd, system, args } = ctx;
    const isDos = system === 'dos' || system === 'win95';
    const separator = isDos ? '\\' : '/';

    let targetPath = cwd;
    if (args.length > 0 && !args[0].startsWith('-')) {
      targetPath = fs.getAbsolutePath(cwd, args[0], separator);
    }

    const contents = fs.listDirectory(targetPath);
    if (contents === null) {
      return {
        output: [],
        error: isDos
          ? 'Invalid path'
          : `tree: ${args[0] || cwd}: No such file or directory`,
      };
    }

    const lines: string[] = [];

    if (isDos) {
      lines.push(`Folder PATH listing for volume C:`);
      lines.push(`Volume serial number is 1234-5678`);
    }

    lines.push(targetPath);

    // Build tree recursively (limited depth for performance)
    const buildTree = (path: string, prefix: string, depth: number): void => {
      if (depth > 3) return; // Limit depth

      const items = fs.listDirectory(path);
      if (!items) return;

      const dirs = items.filter(f => f.type === 'directory');

      dirs.forEach((dir, index) => {
        const isLast = index === dirs.length - 1;
        const connector = isLast ? '└───' : '├───';
        const newPrefix = isLast ? '    ' : '│   ';

        lines.push(`${prefix}${connector}${dir.name}`);

        const childPath = isDos
          ? `${path}\\${dir.name}`
          : `${path}/${dir.name}`.replace('//', '/');

        buildTree(childPath, prefix + newPrefix, depth + 1);
      });
    };

    buildTree(targetPath, '', 0);

    // Count
    const countDirs = (path: string, depth: number): number => {
      if (depth > 3) return 0;
      const items = fs.listDirectory(path);
      if (!items) return 0;

      let count = 0;
      for (const item of items) {
        if (item.type === 'directory') {
          count++;
          const childPath = isDos
            ? `${path}\\${item.name}`
            : `${path}/${item.name}`.replace('//', '/');
          count += countDirs(childPath, depth + 1);
        }
      }
      return count;
    };

    const totalDirs = countDirs(targetPath, 0);
    lines.push('');
    lines.push(`${totalDirs} directories`);

    return { output: lines };
  },
};
