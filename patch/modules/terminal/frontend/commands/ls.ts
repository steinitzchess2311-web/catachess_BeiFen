import type { Command, CommandContext, CommandResult, VirtualFileSystem, VirtualFile } from '../types';

function formatSize(size: number): string {
  if (size >= 1048576) {
    return `${(size / 1048576).toFixed(1)}M`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(0)}K`;
  }
  return `${size}`;
}

function formatDosDir(files: VirtualFile[]): string[] {
  const lines: string[] = [];
  lines.push(' Volume in drive C has no label');
  lines.push(' Directory of C:\\');
  lines.push('');

  let fileCount = 0;
  let dirCount = 0;
  let totalSize = 0;

  for (const file of files) {
    const name = file.name.toUpperCase().padEnd(12);
    if (file.type === 'directory') {
      lines.push(`${name} <DIR>        01-01-95  12:00a`);
      dirCount++;
    } else {
      const size = (file.size || 0).toString().padStart(10);
      lines.push(`${name} ${size}  01-01-95  12:00a`);
      fileCount++;
      totalSize += file.size || 0;
    }
  }

  lines.push('');
  lines.push(`        ${fileCount} file(s)     ${totalSize.toLocaleString()} bytes`);
  lines.push(`        ${dirCount} dir(s)   104,857,600 bytes free`);

  return lines;
}

function formatUnixLs(files: VirtualFile[], showAll: boolean, longFormat: boolean): string[] {
  let filtered = files;
  if (!showAll) {
    filtered = files.filter(f => !f.name.startsWith('.'));
  }

  if (filtered.length === 0) {
    return [];
  }

  if (longFormat) {
    const lines: string[] = [];
    lines.push(`total ${filtered.length * 4}`);

    for (const file of filtered) {
      const perms = file.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
      const size = (file.size || 4096).toString().padStart(8);
      const date = 'Jan  1 12:00';
      const name = file.type === 'directory' ? `\x1b[1;34m${file.name}\x1b[0m` : file.name;
      lines.push(`${perms}  1 user user ${size} ${date} ${name}`);
    }

    return lines;
  }

  // Simple format - names in columns
  const names = filtered.map(f =>
    f.type === 'directory' ? `\x1b[1;34m${f.name}\x1b[0m` : f.name
  );

  // Simple single-line output for now
  return [names.join('  ')];
}

export const lsCommand: Command = {
  name: 'ls',
  aliases: ['dir'],
  description: 'List directory contents',
  usage: 'ls [-la] [directory]',
  handler: (ctx: CommandContext, fs: VirtualFileSystem): CommandResult => {
    const { cwd, system, args, flags } = ctx;
    const separator = system === 'dos' || system === 'win95' ? '\\' : '/';
    const isDos = system === 'dos' || system === 'win95';

    // Determine target directory
    let targetPath = cwd;
    const nonFlagArgs = args.filter(a => !a.startsWith('-'));
    if (nonFlagArgs.length > 0) {
      targetPath = fs.getAbsolutePath(cwd, nonFlagArgs[0], separator);
    }

    // Get directory contents
    const contents = fs.listDirectory(targetPath);
    if (contents === null) {
      const errorMsg = isDos
        ? 'File Not Found'
        : `ls: cannot access '${nonFlagArgs[0] || cwd}': No such file or directory`;
      return { output: [], error: errorMsg };
    }

    if (isDos) {
      return { output: formatDosDir(contents) };
    }

    // Unix-style ls
    const showAll = flags['a'] === true || flags['all'] === true;
    const longFormat = flags['l'] === true;

    return { output: formatUnixLs(contents, showAll, longFormat) };
  },
};

// Also export as 'dir' for Windows compatibility
export const dirCommand: Command = {
  ...lsCommand,
  name: 'dir',
  aliases: ['ls'],
};
