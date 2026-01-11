"""
Player batch analysis script for catachess backend.
Analyzes all games from a player in a PGN file and generates statistics.
"""
import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from collections import Counter

import chess
import chess.pgn

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from core.tagger.facade import tag_position
from core.tagger.config.engine import DEFAULT_STOCKFISH_PATH
from core.tagger.tagging import get_primary_tags, apply_suppression_rules


def analyze_player_games(
    pgn_path: Path,
    player_name: str,
    engine_path: str,
    max_games: int = None,
    output_path: Path = None,
) -> Dict[str, Any]:
    """
    Analyze all games from a specific player.

    Args:
        pgn_path: Path to PGN file
        player_name: Player name to analyze
        engine_path: Path to Stockfish engine
        max_games: Maximum games to analyze (None = all)
        output_path: Optional output path for results

    Returns:
        Analysis results dictionary
    """
    games_analyzed = 0
    total_positions = 0
    tag_counts = Counter()
    mode_counts = Counter()

    player_canon = player_name.lower().replace(" ", "")

    with open(pgn_path) as pgn_file:
        while True:
            game = chess.pgn.read_game(pgn_file)
            if game is None:
                break

            # Check if player is in this game
            white_name = game.headers.get("White", "")
            black_name = game.headers.get("Black", "")

            white_canon = white_name.lower().replace(" ", "")
            black_canon = black_name.lower().replace(" ", "")

            if player_canon not in white_canon and player_canon not in black_canon:
                continue

            player_color = (
                chess.WHITE if player_canon in white_canon else chess.BLACK
            )

            # Analyze game
            board = game.board()
            for move in game.mainline_moves():
                # Only analyze moves by the target player
                if board.turn == player_color:
                    try:
                        result = tag_position(
                            engine_path=engine_path,
                            fen=board.fen(),
                            played_move_uci=move.uci(),
                            depth=14,
                            multipv=6,
                        )

                        # Count tags
                        all_tags = get_primary_tags(result)
                        primary_tags, _ = apply_suppression_rules(all_tags)

                        for tag in primary_tags:
                            tag_counts[tag] += 1

                        mode_counts[result.mode] += 1
                        total_positions += 1

                    except Exception as e:
                        print(f"Error analyzing position: {e}", file=sys.stderr)
                        continue

                board.push(move)

            games_analyzed += 1
            print(f"Analyzed game {games_analyzed}: {white_name} vs {black_name}")

            if max_games and games_analyzed >= max_games:
                break

    # Compute statistics
    results = {
        "player": player_name,
        "games_analyzed": games_analyzed,
        "total_positions": total_positions,
        "tag_distribution": dict(tag_counts),
        "tag_ratios": {
            tag: count / total_positions if total_positions > 0 else 0.0
            for tag, count in tag_counts.items()
        },
        "mode_distribution": dict(mode_counts),
    }

    # Save results if output path provided
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to {output_path}")

    return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Analyze player games and generate tag statistics"
    )
    parser.add_argument("--pgn", required=True, type=Path, help="Path to PGN file")
    parser.add_argument("--player", required=True, help="Player name to analyze")
    parser.add_argument(
        "--engine", default=DEFAULT_STOCKFISH_PATH, help="Path to Stockfish"
    )
    parser.add_argument(
        "--max-games", type=int, help="Maximum games to analyze"
    )
    parser.add_argument(
        "--output", type=Path, help="Output path for results JSON"
    )

    args = parser.parse_args()

    if not args.pgn.exists():
        print(f"Error: PGN file not found: {args.pgn}", file=sys.stderr)
        sys.exit(1)

    results = analyze_player_games(
        pgn_path=args.pgn,
        player_name=args.player,
        engine_path=args.engine,
        max_games=args.max_games,
        output_path=args.output,
    )

    # Print summary
    print(f"\n{'='*60}")
    print(f"Player: {results['player']}")
    print(f"Games Analyzed: {results['games_analyzed']}")
    print(f"Total Positions: {results['total_positions']}")
    print(f"\nTop Tags:")
    sorted_tags = sorted(
        results['tag_ratios'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]
    for tag, ratio in sorted_tags:
        count = results['tag_distribution'][tag]
        print(f"  {tag:40s} {count:5d} ({ratio:.4f})")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
