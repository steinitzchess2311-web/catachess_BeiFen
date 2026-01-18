/**
 * Click-to-move controller.
 *
 * Handles piece selection and square clicks, delegating legality to backend.
 */

import type { BoardPosition, Move, Piece, Square } from '../types';
import { squaresEqual } from '../types';
import { chessAPI } from '../utils/api';

export interface ClickToMoveHooks {
  boardElement: HTMLElement;
  getPosition: () => BoardPosition;
  getSelectedSquare: () => Square | null;
  getLegalMoves: () => Move[];
  setSelection: (selectedSquare: Square | null, legalMoves: Move[]) => void;
  onPieceSelect: (square: Square, piece: Piece) => void;
  onSquareClick: (square: Square) => void;
  makeMove: (move: Move) => Promise<boolean>;
  showLegalMoves: () => boolean;
}

export class ClickToMoveController {
  private hooks: ClickToMoveHooks;
  private handleClickBound: (event: MouseEvent) => void;

  constructor(hooks: ClickToMoveHooks) {
    this.hooks = hooks;
    this.handleClickBound = this.handleClick.bind(this);
    this.hooks.boardElement.addEventListener('click', this.handleClickBound);
  }

  destroy(): void {
    this.hooks.boardElement.removeEventListener('click', this.handleClickBound);
  }

  private getSquareFromEvent(event: MouseEvent): Square | null {
    const target = event.target as HTMLElement | null;
    const squareElement = target?.closest('.square') as HTMLElement | null;
    if (!squareElement) return null;

    const file = Number(squareElement.dataset.file);
    const rank = Number(squareElement.dataset.rank);
    if (Number.isNaN(file) || Number.isNaN(rank)) return null;

    return { file, rank };
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    const square = this.getSquareFromEvent(event);
    if (!square) return;

    this.hooks.onSquareClick(square);

    const position = this.hooks.getPosition();
    const selectedSquare = this.hooks.getSelectedSquare();
    const clickedPiece = position.squares[square.rank][square.file];

    if (selectedSquare && squaresEqual(selectedSquare, square)) {
      this.hooks.setSelection(null, []);
      return;
    }

    if (clickedPiece && clickedPiece.color === position.turn) {
      let legalMoves: Move[] = [];
      if (this.hooks.showLegalMoves()) {
        legalMoves = await chessAPI.getLegalMoves(position, square);
      }
      this.hooks.setSelection(square, legalMoves);
      this.hooks.onPieceSelect(square, clickedPiece);
      return;
    }

    if (!selectedSquare) return;

    const cachedMoves = this.hooks.getLegalMoves();
    if (this.hooks.showLegalMoves() && cachedMoves.length > 0) {
      const isLegal = cachedMoves.some((move) => squaresEqual(move.to, square));
      if (!isLegal) {
        return;
      }
    }

    const move: Move = {
      from: selectedSquare,
      to: square,
    };

    const success = await this.hooks.makeMove(move);
    if (success) {
      this.hooks.setSelection(null, []);
    }
  }
}
