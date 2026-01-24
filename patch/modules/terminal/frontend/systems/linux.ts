import type { SystemConfig } from '../types';

export const linuxSystem: SystemConfig = {
  id: 'linux',
  name: 'Linux',
  prompt: (cwd: string, username = 'user') => {
    const displayPath = cwd === '/home/user' ? '~' : cwd;
    return `${username}@localhost:${displayPath}$ `;
  },
  pathSeparator: '/',
  rootPath: '/',
  homePath: '/home/user',
  colors: {
    background: '#300a24',
    foreground: '#ffffff',
    prompt: '#8ae234',
    error: '#ef2929',
    directory: '#729fcf',
  },
  font: '"Ubuntu Mono", "VT323", "Courier New", monospace',
  startupMessages: [
    'Welcome to Ubuntu 22.04 LTS',
    '',
  ],
  errorMessages: {
    notFound: 'command not found',
    notDirectory: 'Not a directory',
    invalidPath: 'No such file or directory',
  },
};
