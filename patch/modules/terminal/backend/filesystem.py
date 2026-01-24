"""
Virtual File System - Server-side implementation
Provides a simulated filesystem for the terminal module.
"""

from typing import Literal, Optional
from .models import FileInfo


class VirtualFileSystem:
    """
    Virtual filesystem that simulates a classic computer directory structure.
    Supports both Unix-style (/) and Windows-style (\\) paths.
    """

    def __init__(self):
        # Pre-defined directory structure
        self._tree: dict[str, list[FileInfo]] = {
            # Unix-style paths (Linux/Mac)
            "/": [
                FileInfo(name="home", type="directory"),
                FileInfo(name="usr", type="directory"),
                FileInfo(name="etc", type="directory"),
                FileInfo(name="var", type="directory"),
                FileInfo(name="tmp", type="directory"),
            ],
            "/home": [
                FileInfo(name="user", type="directory"),
            ],
            "/home/user": [
                FileInfo(name="Documents", type="directory"),
                FileInfo(name="Downloads", type="directory"),
                FileInfo(name="Pictures", type="directory"),
                FileInfo(name="Music", type="directory"),
                FileInfo(name=".bashrc", type="file", size=3526),
                FileInfo(name=".profile", type="file", size=807),
                FileInfo(name="readme.txt", type="file", size=1024),
            ],
            "/home/user/Documents": [
                FileInfo(name="notes.txt", type="file", size=2048),
                FileInfo(name="project", type="directory"),
            ],
            "/home/user/Documents/project": [
                FileInfo(name="main.c", type="file", size=4096),
                FileInfo(name="Makefile", type="file", size=512),
            ],
            "/home/user/Downloads": [
                FileInfo(name="setup.exe", type="file", size=1048576),
            ],
            "/home/user/Pictures": [
                FileInfo(name="photo.jpg", type="file", size=524288),
            ],
            "/home/user/Music": [
                FileInfo(name="song.mp3", type="file", size=3145728),
            ],
            "/usr": [
                FileInfo(name="bin", type="directory"),
                FileInfo(name="lib", type="directory"),
                FileInfo(name="share", type="directory"),
            ],
            "/usr/bin": [
                FileInfo(name="ls", type="file", size=133792),
                FileInfo(name="cd", type="file", size=0),
            ],
            "/etc": [
                FileInfo(name="passwd", type="file", size=2048),
                FileInfo(name="hosts", type="file", size=256),
            ],
            "/var": [
                FileInfo(name="log", type="directory"),
            ],
            "/var/log": [
                FileInfo(name="syslog", type="file", size=102400),
            ],
            "/tmp": [],
            # macOS specific
            "/Users": [
                FileInfo(name="user", type="directory"),
            ],
            "/Users/user": [
                FileInfo(name="Documents", type="directory"),
                FileInfo(name="Downloads", type="directory"),
                FileInfo(name="Desktop", type="directory"),
                FileInfo(name="Pictures", type="directory"),
                FileInfo(name="Music", type="directory"),
                FileInfo(name=".zshrc", type="file", size=1024),
            ],
            "/Users/user/Documents": [
                FileInfo(name="notes.txt", type="file", size=2048),
            ],
            "/Users/user/Downloads": [],
            "/Users/user/Desktop": [
                FileInfo(name="readme.txt", type="file", size=512),
            ],
            "/Users/user/Pictures": [],
            "/Users/user/Music": [],
            # Windows-style paths (DOS/Win95)
            "C:\\": [
                FileInfo(name="WINDOWS", type="directory"),
                FileInfo(name="PROGRA~1", type="directory"),
                FileInfo(name="DOS", type="directory"),
                FileInfo(name="AUTOEXEC.BAT", type="file", size=256),
                FileInfo(name="CONFIG.SYS", type="file", size=128),
                FileInfo(name="COMMAND.COM", type="file", size=54619),
            ],
            "C:\\WINDOWS": [
                FileInfo(name="SYSTEM", type="directory"),
                FileInfo(name="SYSTEM32", type="directory"),
                FileInfo(name="TEMP", type="directory"),
                FileInfo(name="WIN.INI", type="file", size=4096),
                FileInfo(name="SYSTEM.INI", type="file", size=2048),
            ],
            "C:\\WINDOWS\\SYSTEM": [
                FileInfo(name="USER.EXE", type="file", size=264016),
                FileInfo(name="KERNEL.EXE", type="file", size=327680),
            ],
            "C:\\WINDOWS\\SYSTEM32": [
                FileInfo(name="DRIVERS", type="directory"),
            ],
            "C:\\WINDOWS\\SYSTEM32\\DRIVERS": [],
            "C:\\WINDOWS\\TEMP": [],
            "C:\\PROGRA~1": [
                FileInfo(name="ACCESSORIES", type="directory"),
            ],
            "C:\\PROGRA~1\\ACCESSORIES": [
                FileInfo(name="NOTEPAD.EXE", type="file", size=32768),
                FileInfo(name="CALC.EXE", type="file", size=65536),
            ],
            "C:\\DOS": [
                FileInfo(name="EDIT.COM", type="file", size=413),
                FileInfo(name="QBASIC.EXE", type="file", size=194309),
                FileInfo(name="HELP.COM", type="file", size=413),
            ],
        }

    def _normalize_path(self, path: str, separator: str) -> str:
        """Normalize a path for consistent lookup."""
        if not path or path == separator:
            return "C:\\" if separator == "\\" else "/"

        normalized = path.rstrip(separator) if len(path) > 1 else path

        if separator == "\\":
            normalized = normalized.upper()

        return normalized

    def list_directory(self, path: str) -> Optional[list[FileInfo]]:
        """List contents of a directory."""
        # Try exact match first
        if path in self._tree:
            return self._tree[path]

        # Try uppercase (for Windows paths)
        upper_path = path.upper()
        if upper_path in self._tree:
            return self._tree[upper_path]

        # Try without trailing separator
        stripped = path.rstrip("/\\")
        if stripped in self._tree:
            return self._tree[stripped]

        return None

    def exists(self, path: str) -> bool:
        """Check if a path exists."""
        if self.list_directory(path) is not None:
            return True

        # Check if it's a file in parent directory
        separator = "\\" if "\\" in path else "/"
        parts = path.split(separator)
        filename = parts[-1]
        parent_path = separator.join(parts[:-1]) or (
            "C:\\" if separator == "\\" else "/"
        )

        parent_contents = self.list_directory(parent_path)
        if parent_contents and filename:
            return any(
                f.name == filename or f.name.upper() == filename.upper()
                for f in parent_contents
            )

        return False

    def is_directory(self, path: str) -> bool:
        """Check if a path is a directory."""
        return self.list_directory(path) is not None

    def resolve_path(
        self,
        cwd: str,
        target: str,
        separator: Literal["/", "\\"]
    ) -> str:
        """Resolve a relative path to an absolute path."""
        if not target or target == ".":
            return cwd

        # Check if already absolute
        is_absolute = (
            target.startswith("/") if separator == "/"
            else bool(target and len(target) >= 2 and target[1] == ":")
        )

        if is_absolute:
            return self._normalize_path(target, separator)

        # Handle relative path
        parts = cwd.split(separator)
        # For Windows, preserve drive letter
        if separator == "\\" and parts:
            base_parts = [parts[0]]
            parts = parts[1:]
        else:
            base_parts = []

        result_parts = [p for p in parts if p]
        target_parts = [p for p in target.split(separator) if p]

        for part in target_parts:
            if part == "..":
                if result_parts:
                    result_parts.pop()
            elif part != ".":
                result_parts.append(part)

        if separator == "\\":
            drive = base_parts[0] if base_parts else "C:"
            return f"{drive}\\{separator.join(result_parts)}" if result_parts else f"{drive}\\"

        return "/" + "/".join(result_parts)


# Global instance
virtual_fs = VirtualFileSystem()
