"""
Terminal Module - API Routes
Provides REST endpoints for terminal command execution.
"""

import logging
from typing import Literal
from fastapi import APIRouter

from .models import ExecRequest, ExecResponse, ListDirRequest, ListDirResponse
from .filesystem import virtual_fs

router = APIRouter(prefix="/terminal", tags=["terminal"])
logger = logging.getLogger(__name__)


def _get_separator(system: str) -> Literal["/", "\\"]:
    """Get path separator for the given system."""
    return "\\" if system in ("dos", "win95") else "/"


def _execute_cd(
    cwd: str,
    args: list[str],
    system: str
) -> tuple[list[str], str | None, str | None]:
    """Execute the cd command."""
    separator = _get_separator(system)

    if not args:
        # Go to home
        home = "C:\\" if separator == "\\" else (
            "/Users/user" if system == "mac" else "/home/user"
        )
        return [], None, home

    target = args[0]

    # Handle ~ for Unix systems
    if target == "~" and separator == "/":
        home = "/Users/user" if system == "mac" else "/home/user"
        return [], None, home

    # Resolve the path
    new_path = virtual_fs.resolve_path(cwd, target, separator)

    if not virtual_fs.is_directory(new_path):
        error = (
            "The system cannot find the path specified."
            if separator == "\\"
            else f"cd: {target}: No such file or directory"
        )
        return [], error, None

    return [], None, new_path


def _format_dos_dir(files: list, cwd: str) -> list[str]:
    """Format directory listing in DOS style."""
    lines = [
        " Volume in drive C has no label",
        f" Directory of {cwd}",
        "",
    ]

    file_count = 0
    dir_count = 0
    total_size = 0

    for f in files:
        name = f.name.upper().ljust(12)
        if f.type == "directory":
            lines.append(f"{name} <DIR>        01-01-95  12:00a")
            dir_count += 1
        else:
            size = str(f.size or 0).rjust(10)
            lines.append(f"{name} {size}  01-01-95  12:00a")
            file_count += 1
            total_size += f.size or 0

    lines.extend([
        "",
        f"        {file_count} file(s)     {total_size:,} bytes",
        f"        {dir_count} dir(s)   104,857,600 bytes free",
    ])

    return lines


def _format_unix_ls(files: list, show_all: bool, long_format: bool) -> list[str]:
    """Format directory listing in Unix style."""
    filtered = [f for f in files if show_all or not f.name.startswith(".")]

    if not filtered:
        return []

    if long_format:
        lines = [f"total {len(filtered) * 4}"]
        for f in filtered:
            perms = "drwxr-xr-x" if f.type == "directory" else "-rw-r--r--"
            size = str(f.size or 4096).rjust(8)
            date = "Jan  1 12:00"
            lines.append(f"{perms}  1 user user {size} {date} {f.name}")
        return lines

    # Simple format
    return ["  ".join(f.name for f in filtered)]


def _execute_ls(
    cwd: str,
    args: list[str],
    flags: dict[str, bool],
    system: str
) -> tuple[list[str], str | None]:
    """Execute the ls/dir command."""
    separator = _get_separator(system)
    is_dos = system in ("dos", "win95")

    # Determine target directory
    non_flag_args = [a for a in args if not a.startswith("-")]
    target_path = cwd
    if non_flag_args:
        target_path = virtual_fs.resolve_path(cwd, non_flag_args[0], separator)

    # Get directory contents
    contents = virtual_fs.list_directory(target_path)
    if contents is None:
        error = (
            "File Not Found"
            if is_dos
            else f"ls: cannot access '{non_flag_args[0] if non_flag_args else cwd}': No such file or directory"
        )
        return [], error

    if is_dos:
        return _format_dos_dir(contents, target_path), None

    show_all = flags.get("a", False) or flags.get("all", False)
    long_format = flags.get("l", False)
    return _format_unix_ls(contents, show_all, long_format), None


def _parse_command(command: str) -> tuple[str, list[str], dict[str, bool]]:
    """Parse command line into command name, args, and flags."""
    parts = command.strip().split()
    if not parts:
        return "", [], {}

    cmd_name = parts[0].lower()
    args = []
    flags: dict[str, bool] = {}

    for part in parts[1:]:
        if part.startswith("--"):
            key = part[2:].split("=")[0]
            flags[key] = True
        elif part.startswith("-"):
            for char in part[1:]:
                flags[char] = True
        else:
            args.append(part)

    return cmd_name, args, flags


@router.post("/exec", response_model=ExecResponse)
async def execute_command(request: ExecRequest) -> ExecResponse:
    """Execute a terminal command and return the result."""
    cmd_name, args, flags = _parse_command(request.command)

    if not cmd_name:
        return ExecResponse(success=True, output=[])

    is_dos = request.system in ("dos", "win95")

    # Route to command handlers
    if cmd_name in ("cd", "chdir"):
        output, error, new_cwd = _execute_cd(request.cwd, args, request.system)
        return ExecResponse(
            success=error is None,
            output=output,
            error=error,
            new_cwd=new_cwd,
        )

    if cmd_name in ("ls", "dir"):
        output, error = _execute_ls(request.cwd, args, flags, request.system)
        return ExecResponse(
            success=error is None,
            output=output,
            error=error,
        )

    if cmd_name in ("clear", "cls"):
        return ExecResponse(success=True, output=["__CLEAR__"])

    if cmd_name in ("help", "?"):
        if is_dos:
            output = [
                "Available commands:",
                "",
                "  CD       Change directory",
                "  DIR      List directory contents",
                "  CLS      Clear screen",
                "  HELP     Display this help",
                "  VER      Display version",
            ]
        else:
            output = [
                "Available commands:",
                "",
                "  cd       Change directory",
                "  ls       List directory contents",
                "  clear    Clear screen",
                "  help     Display this help",
                "  uname    Display system information",
            ]
        return ExecResponse(success=True, output=output)

    if cmd_name in ("ver", "uname", "version"):
        version_map = {
            "dos": "MS-DOS Version 6.22",
            "win95": "Microsoft Windows 95 [Version 4.00.950]",
            "linux": "Linux localhost 5.15.0-generic #1 SMP x86_64 GNU/Linux",
            "mac": "Darwin Mac.local 22.0.0 Darwin Kernel Version 22.0.0",
        }
        return ExecResponse(
            success=True,
            output=[version_map.get(request.system, "Unknown System")],
        )

    # Unknown command
    error = (
        "Bad command or file name"
        if is_dos
        else f"{cmd_name}: command not found"
    )
    return ExecResponse(success=False, output=[], error=error)


@router.post("/list", response_model=ListDirResponse)
async def list_directory(request: ListDirRequest) -> ListDirResponse:
    """List contents of a directory."""
    contents = virtual_fs.list_directory(request.path)
    if contents is None:
        return ListDirResponse(
            success=False,
            error=f"Directory not found: {request.path}",
        )

    return ListDirResponse(success=True, files=contents)
