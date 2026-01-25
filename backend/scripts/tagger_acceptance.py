"""
Tagger pipeline acceptance smoke test.
"""
from __future__ import annotations

import argparse
import uuid
from pathlib import Path

from sqlalchemy import select

from modules.tagger.db import TaggerSessionLocal
from modules.tagger.service import TaggerService, normalize_name
from models.tagger import PlayerProfile


def get_or_create_player(svc: TaggerService, name: str) -> PlayerProfile:
    normalized = normalize_name(name)
    player = svc.db.scalar(
        select(PlayerProfile).where(PlayerProfile.normalized_name == normalized)
    )
    if player:
        return player
    return svc.create_player(name, [])


def main() -> None:
    parser = argparse.ArgumentParser(description="Run tagger pipeline acceptance test.")
    parser.add_argument(
        "--pgn",
        default="backend/core/tagger/player_pgn/test_LouYiping.pgn",
        help="Path to PGN file",
    )
    parser.add_argument(
        "--player",
        default="Lou Yiping",
        help="Player display name to match",
    )
    args = parser.parse_args()

    pgn_path = Path(args.pgn)
    if not pgn_path.exists():
        raise SystemExit(f"PGN not found: {pgn_path}")

    content = pgn_path.read_bytes()
    upload_user_id = uuid.uuid4()

    db = TaggerSessionLocal()
    try:
        svc = TaggerService(db)
        player = get_or_create_player(svc, args.player)
        upload = svc.create_upload(player.id, content, pgn_path.name, upload_user_id)
        status = svc.get_upload_status(upload.id)
        print("Upload status:", status)
        stats_total = svc.get_stats(player.id, "total")
        print(f"Total tags rows: {len(stats_total)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
