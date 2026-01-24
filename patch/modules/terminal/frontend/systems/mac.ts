import type { SystemConfig } from '../types';

export const macSystem: SystemConfig = {
  id: 'mac',
  name: 'macOS',
  prompt: (cwd: string, username = 'user') => {
    const displayPath = cwd === '/Users/user' ? '~' : cwd;
    return `${username}@Mac ${displayPath} % `;
  },
  pathSeparator: '/',
  rootPath: '/',
  homePath: '/Users/user',
  colors: {
    background: '#1e1e1e',
    foreground: '#f0f0f0',
    prompt: '#f0f0f0',
    error: '#ff6b6b',
    directory: '#6cb6ff',
  },
  font: '"SF Mono", "Menlo", "VT323", "Courier New", monospace',
  startupMessages: [
    'Last login: ' + new Date().toLocaleString(),
    '',
  ],
  errorMessages: {
    notFound: 'command not found',
    notDirectory: 'Not a directory',
    invalidPath: 'No such file or directory',
  },
};
