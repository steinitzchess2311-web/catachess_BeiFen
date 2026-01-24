"""
Terminal Module - Pydantic Models
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    """Virtual file/directory information."""
    name: str
    type: Literal["file", "directory"]
    size: Optional[int] = None
    modified: Optional[str] = None


class ExecRequest(BaseModel):
    """Request to execute a terminal command."""
    command: str = Field(..., description="The command to execute")
    cwd: str = Field(..., description="Current working directory")
    system: Literal["dos", "win95", "linux", "mac"] = Field(
        default="dos",
        description="Operating system style"
    )


class ExecResponse(BaseModel):
    """Response from command execution."""
    success: bool
    output: list[str] = Field(default_factory=list)
    error: Optional[str] = None
    new_cwd: Optional[str] = None


class ListDirRequest(BaseModel):
    """Request to list directory contents."""
    path: str
    system: Literal["dos", "win95", "linux", "mac"] = "dos"


class ListDirResponse(BaseModel):
    """Response with directory contents."""
    success: bool
    files: list[FileInfo] = Field(default_factory=list)
    error: Optional[str] = None
