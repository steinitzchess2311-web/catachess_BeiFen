"""
Chess rules router.

Provides minimal chess rule endpoints used by the frontend chessboard UI.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.chess_basic.constants import Color, PieceType as CorePieceType
from core.chess_basic.rule.api import (
    apply_move,
    generate_legal_moves,
    is_check,
    is_checkmate,
    is_legal_move,
)
from core.chess_basic.rule.special_moves import get_captured_piece_square
from core.chess_basic.types import Move, Square
from core.chess_basic.utils.fen import parse_fen, board_to_fen
from core.chess_basic.utils.san import move_to_san, needs_disambiguation


router = APIRouter(prefix="/api/chess", tags=["chess"])


class SquareRequest(BaseModel):
    file: int = Field(..., ge=0, le=7)
    rank: int = Field(..., ge=0, le=7)


class MoveRequest(BaseModel):
    from_square: SquareRequest
    to_square: SquareRequest
    promotion: str | None = None


class PositionRequest(BaseModel):
    position: str
    move: MoveRequest | None = None
    square: SquareRequest | None = None


def _promotion_to_piece(promotion: str | None) -> CorePieceType | None:
    if not promotion:
        return None
    value = promotion.lower()
    mapping = {
        "q": CorePieceType.QUEEN,
        "queen": CorePieceType.QUEEN,
        "r": CorePieceType.ROOK,
        "rook": CorePieceType.ROOK,
        "b": CorePieceType.BISHOP,
        "bishop": CorePieceType.BISHOP,
        "n": CorePieceType.KNIGHT,
        "knight": CorePieceType.KNIGHT,
    }
    return mapping.get(value)


def _move_from_request(move: MoveRequest) -> Move:
    promotion = _promotion_to_piece(move.promotion)
    return Move(
        from_square=Square(file=move.from_square.file, rank=move.from_square.rank),
        to_square=Square(file=move.to_square.file, rank=move.to_square.rank),
        promotion=promotion,
    )


def _move_to_response(move: Move) -> dict:
    promotion = None
    if move.promotion:
        promotion = move.promotion.value  # pawn/knight/bishop/rook/queen/king
    return {
        "from": {"file": move.from_square.file, "rank": move.from_square.rank},
        "to": {"file": move.to_square.file, "rank": move.to_square.rank},
        "promotion": promotion,
    }


@router.post("/validate-move")
async def validate_move(request: PositionRequest) -> dict:
    if request.move is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="move is required")
    state = parse_fen(request.position)
    move = _move_from_request(request.move)
    return {"is_legal": is_legal_move(state, move)}


@router.post("/legal-moves")
async def legal_moves(request: PositionRequest) -> dict:
    state = parse_fen(request.position)
    moves = generate_legal_moves(state)
    if request.square is not None:
        moves = [
            move
            for move in moves
            if move.from_square.file == request.square.file
            and move.from_square.rank == request.square.rank
        ]
    return {"legal_moves": [_move_to_response(move) for move in moves]}


@router.post("/apply-move")
async def apply_move_endpoint(request: PositionRequest) -> dict:
    if request.move is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="move is required")
    state = parse_fen(request.position)
    move = _move_from_request(request.move)
    if not is_legal_move(state, move):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Illegal move")
    legal_moves = generate_legal_moves(state)
    piece = state.get_piece(move.from_square)
    disambiguation = None
    if piece is not None:
        disambiguation = needs_disambiguation(
            piece,
            move.from_square,
            move.to_square,
            state,
            legal_moves,
        )
    is_capture = get_captured_piece_square(state, move) is not None
    new_state = apply_move(state, move)
    is_check_after = is_check(new_state)
    is_checkmate_after = is_checkmate(new_state)
    san = move_to_san(
        move,
        state,
        is_check=is_check_after,
        is_checkmate=is_checkmate_after,
        is_capture=is_capture,
        disambiguation=disambiguation,
    )
    color = "white" if state.turn == Color.WHITE else "black"
    fen = board_to_fen(new_state)
    return {
        "new_position": {"fen": fen},
        "move": {
            "san": san,
            "uci": move.to_uci(),
            "fen": fen,
            "move_number": state.fullmove_number,
            "color": color,
        },
    }


@router.post("/is-check")
async def is_check_endpoint(request: PositionRequest) -> dict:
    state = parse_fen(request.position)
    return {"is_check": is_check(state)}


@router.post("/is-checkmate")
async def is_checkmate_endpoint(request: PositionRequest) -> dict:
    state = parse_fen(request.position)
    return {"is_checkmate": is_checkmate(state)}
