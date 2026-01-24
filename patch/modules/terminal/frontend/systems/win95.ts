import type { SystemConfig } from '../types';

export const win95System: SystemConfig = {
  id: 'win95',
  name: 'Windows 95',
  prompt: (cwd: string) => `${cwd}>`,
  pathSeparator: '\\',
  rootPath: 'C:\\',
  homePath: 'C:\\WINDOWS',
  colors: {
    background: '#000000',
    foreground: '#c0c0c0',
    prompt: '#c0c0c0',
    error: '#ff6b6b',
    directory: '#c0c0c0',
  },
  font: '"Fixedsys", "VT323", "Courier New", monospace',
  startupMessages: [
    'Microsoft(R) Windows 95',
    '   (C)Copyright Microsoft Corp 1981-1995.',
    '',
  ],
  errorMessages: {
    notFound: "Bad command or file name",
    notDirectory: 'The directory name is invalid.',
    invalidPath: 'The system cannot find the path specified.',
  },
};
