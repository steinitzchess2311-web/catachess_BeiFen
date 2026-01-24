import type { SystemConfig } from '../types';

export const dosSystem: SystemConfig = {
  id: 'dos',
  name: 'MS-DOS',
  prompt: (cwd: string) => `${cwd}>`,
  pathSeparator: '\\',
  rootPath: 'C:\\',
  homePath: 'C:\\',
  colors: {
    background: '#000000',
    foreground: '#00ff00',
    prompt: '#00ff00',
    error: '#ff5555',
    directory: '#00ff00',
  },
  font: '"VT323", "Courier New", monospace',
  startupMessages: [
    'Microsoft(R) MS-DOS(R) Version 6.22',
    '             (C)Copyright Microsoft Corp 1981-1994.',
    '',
  ],
  errorMessages: {
    notFound: 'Bad command or file name',
    notDirectory: 'Invalid directory',
    invalidPath: 'Invalid path',
  },
};
