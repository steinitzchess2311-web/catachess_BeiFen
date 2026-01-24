/**
 * Virtual File System - Client-side implementation
 * Simulates a classic file system for the terminal
 */

import type { VirtualFile, VirtualFileSystem } from './types';

// Pre-defined directory structure
const directoryTree: Record<string, VirtualFile[]> = {
  // Unix-style paths (Linux/Mac)
  '/': [
    { name: 'home', type: 'directory' },
    { name: 'usr', type: 'directory' },
    { name: 'etc', type: 'directory' },
    { name: 'var', type: 'directory' },
    { name: 'tmp', type: 'directory' },
  ],
  '/home': [
    { name: 'user', type: 'directory' },
  ],
  '/home/user': [
    { name: 'Documents', type: 'directory' },
    { name: 'Downloads', type: 'directory' },
    { name: 'Pictures', type: 'directory' },
    { name: 'Music', type: 'directory' },
    { name: '.bashrc', type: 'file', size: 3526 },
    { name: '.profile', type: 'file', size: 807 },
    { name: 'readme.txt', type: 'file', size: 1024 },
  ],
  '/home/user/Documents': [
    { name: 'notes.txt', type: 'file', size: 2048 },
    { name: 'project', type: 'directory' },
  ],
  '/home/user/Documents/project': [
    { name: 'main.c', type: 'file', size: 4096 },
    { name: 'Makefile', type: 'file', size: 512 },
  ],
  '/home/user/Downloads': [
    { name: 'setup.exe', type: 'file', size: 1048576 },
  ],
  '/home/user/Pictures': [
    { name: 'photo.jpg', type: 'file', size: 524288 },
  ],
  '/home/user/Music': [
    { name: 'song.mp3', type: 'file', size: 3145728 },
  ],
  '/usr': [
    { name: 'bin', type: 'directory' },
    { name: 'lib', type: 'directory' },
    { name: 'share', type: 'directory' },
  ],
  '/usr/bin': [
    { name: 'ls', type: 'file', size: 133792 },
    { name: 'cd', type: 'file', size: 0 },
  ],
  '/etc': [
    { name: 'passwd', type: 'file', size: 2048 },
    { name: 'hosts', type: 'file', size: 256 },
  ],
  '/var': [
    { name: 'log', type: 'directory' },
  ],
  '/var/log': [
    { name: 'syslog', type: 'file', size: 102400 },
  ],
  '/tmp': [],

  // macOS specific
  '/Users': [
    { name: 'user', type: 'directory' },
  ],
  '/Users/user': [
    { name: 'Documents', type: 'directory' },
    { name: 'Downloads', type: 'directory' },
    { name: 'Desktop', type: 'directory' },
    { name: 'Pictures', type: 'directory' },
    { name: 'Music', type: 'directory' },
    { name: '.zshrc', type: 'file', size: 1024 },
  ],
  '/Users/user/Documents': [
    { name: 'notes.txt', type: 'file', size: 2048 },
  ],
  '/Users/user/Downloads': [],
  '/Users/user/Desktop': [
    { name: 'readme.txt', type: 'file', size: 512 },
  ],
  '/Users/user/Pictures': [],
  '/Users/user/Music': [],

  // Windows-style paths (DOS/Win95)
  'C:\\': [
    { name: 'WINDOWS', type: 'directory' },
    { name: 'PROGRA~1', type: 'directory' },
    { name: 'DOS', type: 'directory' },
    { name: 'AUTOEXEC.BAT', type: 'file', size: 256 },
    { name: 'CONFIG.SYS', type: 'file', size: 128 },
    { name: 'COMMAND.COM', type: 'file', size: 54619 },
  ],
  'C:\\WINDOWS': [
    { name: 'SYSTEM', type: 'directory' },
    { name: 'SYSTEM32', type: 'directory' },
    { name: 'TEMP', type: 'directory' },
    { name: 'WIN.INI', type: 'file', size: 4096 },
    { name: 'SYSTEM.INI', type: 'file', size: 2048 },
  ],
  'C:\\WINDOWS\\SYSTEM': [
    { name: 'USER.EXE', type: 'file', size: 264016 },
    { name: 'KERNEL.EXE', type: 'file', size: 327680 },
  ],
  'C:\\WINDOWS\\SYSTEM32': [
    { name: 'DRIVERS', type: 'directory' },
  ],
  'C:\\WINDOWS\\SYSTEM32\\DRIVERS': [],
  'C:\\WINDOWS\\TEMP': [],
  'C:\\PROGRA~1': [
    { name: 'ACCESSORIES', type: 'directory' },
  ],
  'C:\\PROGRA~1\\ACCESSORIES': [
    { name: 'NOTEPAD.EXE', type: 'file', size: 32768 },
    { name: 'CALC.EXE', type: 'file', size: 65536 },
  ],
  'C:\\DOS': [
    { name: 'EDIT.COM', type: 'file', size: 413 },
    { name: 'QBASIC.EXE', type: 'file', size: 194309 },
    { name: 'HELP.COM', type: 'file', size: 413 },
  ],
};

export function createVirtualFileSystem(): VirtualFileSystem {
  const normalizePath = (path: string, separator: '/' | '\\'): string => {
    // Handle empty or just separator
    if (!path || path === separator) {
      return separator === '\\' ? 'C:\\' : '/';
    }

    // Remove trailing separator (except for root)
    let normalized = path;
    if (normalized.length > 1 && normalized.endsWith(separator)) {
      normalized = normalized.slice(0, -1);
    }

    // Ensure Windows paths are uppercase for consistency
    if (separator === '\\') {
      normalized = normalized.toUpperCase();
    }

    return normalized;
  };

  const getAbsolutePath = (cwd: string, target: string, separator: '/' | '\\'): string => {
    if (!target || target === '.') {
      return cwd;
    }

    const isAbsolute = separator === '/'
      ? target.startsWith('/')
      : /^[A-Za-z]:\\/.test(target);

    if (isAbsolute) {
      return normalizePath(target, separator);
    }

    // Handle .. and relative paths
    const parts = cwd.split(separator).filter(Boolean);
    const targetParts = target.split(separator).filter(Boolean);

    // For Windows, keep drive letter
    let baseParts: string[] = [];
    if (separator === '\\' && parts.length > 0) {
      baseParts = [parts[0]]; // Keep C:
      parts.shift();
    }

    const resultParts = [...parts];

    for (const part of targetParts) {
      if (part === '..') {
        if (resultParts.length > 0) {
          resultParts.pop();
        }
      } else if (part !== '.') {
        resultParts.push(part);
      }
    }

    if (separator === '\\') {
      const drive = baseParts[0] || 'C:';
      return resultParts.length === 0
        ? `${drive}\\`
        : `${drive}\\${resultParts.join('\\')}`;
    }

    return '/' + resultParts.join('/');
  };

  const resolvePath = (cwd: string, target: string, separator: '/' | '\\'): string => {
    return getAbsolutePath(cwd, target, separator);
  };

  const listDirectory = (path: string): VirtualFile[] | null => {
    const normalized = path.toUpperCase().replace(/\/$/, '') || '/';

    // Try exact match first
    if (directoryTree[path]) {
      return directoryTree[path];
    }

    // Try uppercase (for Windows paths)
    if (directoryTree[normalized]) {
      return directoryTree[normalized];
    }

    // Try with trailing separator removed
    const withoutTrailing = path.replace(/[/\\]$/, '');
    if (directoryTree[withoutTrailing]) {
      return directoryTree[withoutTrailing];
    }

    return null;
  };

  const exists = (path: string): boolean => {
    // Check if it's a directory
    if (listDirectory(path) !== null) {
      return true;
    }

    // Check if it's a file in parent directory
    const separator = path.includes('\\') ? '\\' : '/';
    const parts = path.split(separator);
    const fileName = parts.pop();
    const parentPath = parts.join(separator) || (separator === '/' ? '/' : 'C:\\');

    const parentContents = listDirectory(parentPath);
    if (parentContents && fileName) {
      return parentContents.some(f => f.name === fileName || f.name.toUpperCase() === fileName.toUpperCase());
    }

    return false;
  };

  const isDirectory = (path: string): boolean => {
    return listDirectory(path) !== null;
  };

  return {
    listDirectory,
    exists,
    isDirectory,
    resolvePath,
    getAbsolutePath,
  };
}

export const virtualFS = createVirtualFileSystem();
