"""
Postgres repository for tagger pipeline.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.tagger import FailedGame, PgnGame, TagStat


class TaggerRepo:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_existing_game_id(self, player_id: uuid.UUID, game_hash: str) -> Optional[uuid.UUID]:
        return self._db.scalar(
            select(PgnGame.id).where(
                PgnGame.player_id == player_id,
                PgnGame.game_hash == game_hash,
            )
        )

    def add_pgn_game(self, game: PgnGame) -> None:
        self._db.add(game)

    def add_failed_game(self, failed: FailedGame) -> None:
        self._db.add(failed)

    def get_tag_stats(
        self,
        player_id: uuid.UUID,
        scope: str,
        engine_version: str,
        depth: int,
        multipv: int,
        stats_version: str,
    ) -> list[TagStat]:
        return list(
            self._db.scalars(
                select(TagStat).where(
                    TagStat.player_id == player_id,
                    TagStat.scope == scope,
                    TagStat.engine_version == engine_version,
                    TagStat.depth == depth,
                    TagStat.multipv == multipv,
                    TagStat.stats_version == stats_version,
                )
            ).all()
        )
