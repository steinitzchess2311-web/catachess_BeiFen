import type { SystemConfig, SystemType } from '../types';
import { dosSystem } from './dos';
import { win95System } from './win95';
import { linuxSystem } from './linux';
import { macSystem } from './mac';

export const systems: Record<SystemType, SystemConfig> = {
  dos: dosSystem,
  win95: win95System,
  linux: linuxSystem,
  mac: macSystem,
};

export function getSystem(type: SystemType): SystemConfig {
  return systems[type];
}

export function getSystemList(): { id: SystemType; name: string }[] {
  return [
    { id: 'dos', name: 'MS-DOS' },
    { id: 'win95', name: 'Windows 95' },
    { id: 'linux', name: 'Linux (Ubuntu)' },
    { id: 'mac', name: 'macOS' },
  ];
}

export { dosSystem, win95System, linuxSystem, macSystem };
