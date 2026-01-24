# CataChess Virtual Terminal

A retro terminal emulator that brings back the nostalgia of 90s computing. Features multiple operating system styles, a virtual filesystem, and plenty of fun commands.

![Terminal Preview](https://via.placeholder.com/600x400?text=Virtual+Terminal)

## Features

- **4 Operating System Styles**: MS-DOS, Windows 95, Linux (Ubuntu), and macOS
- **Draggable & Resizable Window**: Just like the old days
- **Virtual Filesystem**: Navigate a simulated directory structure
- **CRT Effects**: Scanlines and phosphor glow (toggleable)
- **Retro Fonts**: VT323 and other period-appropriate typefaces
- **30+ Commands**: From useful utilities to fun easter eggs

## Quick Start

### Easiest: Use TerminalLauncher

Just drop this anywhere in your app - it adds a fixed button in the bottom-right corner:

```tsx
import { TerminalLauncher } from '@patch/modules/terminal';

function App() {
  return (
    <div>
      {/* Your app content */}
      <TerminalLauncher initialSystem="dos" />
    </div>
  );
}
```

- Click the `>_` button to open terminal
- Press **F12** or **Ctrl+`** to toggle
- Button stays fixed in bottom-right corner

### Manual Control

For more control over when the terminal appears:

```tsx
import { TerminalProvider, TerminalWindow } from '@patch/modules/terminal';

function App() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <TerminalProvider initialSystem="dos">
      {isOpen && <TerminalWindow onClose={() => setIsOpen(false)} />}
    </TerminalProvider>
  );
}
```

## Available Commands

### File Operations

| Command | Alias | Description |
|---------|-------|-------------|
| `cd` | `chdir` | Change directory |
| `ls` | `dir` | List directory contents |
| `pwd` | - | Print working directory |
| `cat` | `type` | Display file contents |
| `tree` | - | Display directory tree |

### System Information

| Command | Alias | Description |
|---------|-------|-------------|
| `ver` | `uname`, `version` | Display system version |
| `whoami` | - | Display current user |
| `hostname` | - | Display computer name |
| `date` | - | Display current date |
| `time` | - | Display current time |
| `mem` | `free` | Display memory usage |
| `history` | `doskey /history` | Display command history |
| `neofetch` | `screenfetch` | System info with ASCII art |

### Utilities

| Command | Alias | Description |
|---------|-------|-------------|
| `clear` | `cls` | Clear the screen |
| `echo` | - | Print text |
| `help` | `?`, `commands` | Display help |
| `ping` | - | Network connectivity test |
| `color` | `theme` | Change terminal colors |

### 90s Nostalgia

| Command | Description |
|---------|-------------|
| `edit` | Open simulated text editor (DOS Edit / Nano / Vim) |
| `format` | "Format" a disk (don't worry, it's fake) |
| `deltree` | Delete directory tree (simulated) |
| `scandisk` | Check disk for errors |
| `defrag` | Defragment disk (with ASCII animation) |

### Fun & Easter Eggs

| Command | Description |
|---------|-------------|
| `cowsay <msg>` | ASCII cow with your message |
| `cowthink <msg>` | ASCII cow thinking |
| `fortune` | Random quote or joke |
| `matrix` | The Matrix digital rain effect |
| `sl` | Steam locomotive (you meant `ls`!) |
| `about` | About this terminal |

## System Styles

### MS-DOS
```
C:\>dir
 Volume in drive C has no label
 Directory of C:\

WINDOWS      <DIR>        01-01-95  12:00a
DOS          <DIR>        01-01-95  12:00a
AUTOEXEC BAT        256  01-01-95  12:00a
```
- Green phosphor text on black
- `C:\>` prompt style
- Backslash path separators

### Windows 95
```
C:\WINDOWS>ver

Microsoft Windows 95 [Version 4.00.950]
(C) Copyright Microsoft Corp 1981-1995.
```
- Gray/white text on black
- Classic command prompt feel

### Linux (Ubuntu)
```
user@localhost:~$ ls -la
total 28
drwxr-xr-x  5 user user 4096 Jan  1 12:00 .
drwxr-xr-x  3 user user 4096 Jan  1 12:00 ..
-rw-r--r--  1 user user 3526 Jan  1 12:00 .bashrc
```
- White/green text on Ubuntu purple
- `user@host:path$` prompt
- Forward slash paths

### macOS
```
user@Mac ~ % uname -a
Darwin Mac.local 22.0.0 Darwin Kernel Version 22.0.0: x86_64
```
- Clean white text on dark gray
- `user@Mac path %` prompt
- Terminal.app styling

## Virtual Filesystem

The terminal includes a pre-populated virtual filesystem:

**Unix/Mac paths:**
```
/
├── home/user/
│   ├── Documents/
│   │   ├── notes.txt
│   │   └── project/
│   ├── Downloads/
│   ├── Pictures/
│   └── Music/
├── usr/bin/
├── etc/
├── var/log/
└── tmp/
```

**DOS/Windows paths:**
```
C:\
├── WINDOWS\
│   ├── SYSTEM\
│   ├── SYSTEM32\
│   └── TEMP\
├── PROGRA~1\
│   └── ACCESSORIES\
├── DOS\
├── AUTOEXEC.BAT
├── CONFIG.SYS
└── COMMAND.COM
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `↑` / `↓` | Navigate command history |
| `Ctrl+C` | Cancel current input |
| `Ctrl+L` | Clear screen |

## Window Controls

- **Drag title bar**: Move window
- **Double-click title bar**: Maximize/restore
- **Drag edges/corners**: Resize window
- **Minimize button**: Minimize to taskbar
- **Maximize button**: Toggle fullscreen
- **Close button**: Close terminal

## Configuration

### Available Color Schemes

```
color dos      - Classic DOS green
color amber    - Amber monitor style
color white    - White on black
color blue     - Blue screen style
color matrix   - Matrix green
color ubuntu   - Ubuntu terminal
```

### Toggle Effects

The toolbar provides toggles for:
- **Scanlines**: CRT scanline effect
- **CRT Glow**: Phosphor glow effect

## API Reference

### Components

```tsx
// Main window component
<TerminalWindow
  className?: string
  onClose?: () => void
/>

// Terminal content only (no window chrome)
<Terminal className?: string />

// System selector dropdown
<SystemPicker className?: string />
```

### Context Hook

```tsx
const {
  state,              // Terminal state
  executeCommand,     // Run a command
  setSystem,          // Change OS style
  clear,              // Clear screen
  navigateHistory,    // Browse command history
  toggleEffect,       // Toggle visual effects
  setWindowPosition,  // Move window
  setWindowSize,      // Resize window
  toggleMaximize,     // Max/restore
  toggleMinimize,     // Minimize
  setVisible,         // Show/hide
} = useTerminal();
```

### State Shape

```typescript
interface TerminalState {
  system: 'dos' | 'win95' | 'linux' | 'mac';
  cwd: string;
  username: string;
  hostname: string;
  history: TerminalLine[];
  commandHistory: string[];
  effects: {
    scanlines: boolean;
    sound: boolean;
    crtGlow: boolean;
  };
}
```

## File Structure

```
terminal/
├── index.ts                 # Main exports
├── README.md                # This file
├── frontend/
│   ├── index.ts             # Frontend exports
│   ├── types.ts             # TypeScript types
│   ├── styles.css           # CRT styles
│   ├── terminalContext.tsx  # State management
│   ├── Terminal.tsx         # Main terminal component
│   ├── TerminalWindow.tsx   # Draggable window
│   ├── TerminalLine.tsx     # Line renderer
│   ├── SystemPicker.tsx     # OS selector
│   ├── filesystem.ts        # Virtual FS
│   ├── commands/            # Command implementations
│   │   ├── index.ts
│   │   ├── cd.ts
│   │   ├── ls.ts
│   │   ├── cat.ts
│   │   ├── cowsay.ts
│   │   ├── fortune.ts
│   │   ├── matrix.ts
│   │   └── ...
│   └── systems/             # OS configurations
│       ├── index.ts
│       ├── dos.ts
│       ├── win95.ts
│       ├── linux.ts
│       └── mac.ts
└── backend/
    ├── __init__.py
    ├── api.py               # FastAPI routes
    ├── filesystem.py        # Server-side FS
    └── models.py            # Pydantic models
```

## Adding New Commands

1. Create a new file in `commands/`:

```typescript
// commands/mycommand.ts
import type { Command, CommandContext, CommandResult } from '../types';

export const myCommand: Command = {
  name: 'mycommand',
  aliases: ['mc'],
  description: 'My custom command',
  usage: 'mycommand [args]',
  handler: (ctx: CommandContext): CommandResult => {
    return {
      output: ['Hello from my command!'],
    };
  },
};
```

2. Register it in `commands/index.ts`:

```typescript
import { myCommand } from './mycommand';
registerCommand(myCommand);
```

## Easter Eggs

Try these commands:
- `sl` - Oops, wrong command!
- `cowsay moo` - 🐄
- `fortune` - Wisdom awaits
- `matrix` - Follow the white rabbit
- `format c:` - Don't worry...
- `neofetch` - Show off your system

## Credits

Made with nostalgia and love for the 90s computing era.

```
  _____      _         _____ _
 / ____|    | |       / ____| |
| |     __ _| |_ __ _| |    | |__   ___  ___ ___
| |    / _` | __/ _` | |    | '_ \ / _ \/ __/ __|
| |___| (_| | || (_| | |____| | | |  __/\__ \__ \
 \_____\__,_|\__\__,_|\_____|_| |_|\___||___/___/

        Virtual Terminal v1.0.0
```
