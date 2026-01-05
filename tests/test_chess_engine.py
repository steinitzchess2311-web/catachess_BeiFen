import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from core.chess_engine.client import EngineClient

engine = EngineClient()  # ← 不传 URL，自动用 config

fen = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"

result = engine.analyze(fen, depth=15, multipv=3)

for line in result.lines:
    print(
        f"PV{line.multipv} | score={line.score} | pv={' '.join(line.pv)}"
    )

