"""
Stats aggregation for tagger pipeline.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class ScopeStats:
    tag_counts: Dict[str, int] = field(default_factory=dict)
    total_positions: int = 0


class StatsAccumulator:
    def __init__(self) -> None:
        self._scopes: Dict[str, ScopeStats] = {
            "white": ScopeStats(),
            "black": ScopeStats(),
            "total": ScopeStats(),
        }

    def add_move(self, scope: str) -> None:
        self._scopes[scope].total_positions += 1

    def add_tags(self, scope: str, tags: list[str]) -> None:
        stats = self._scopes[scope]
        for tag in tags:
            stats.tag_counts[tag] = stats.tag_counts.get(tag, 0) + 1

    def scope_stats(self, scope: str) -> ScopeStats:
        return self._scopes[scope]

    def all_scopes(self) -> Dict[str, ScopeStats]:
        return self._scopes
