/**
 * Chess Piece Sets Module
 *
 * Manages different visual styles for chess pieces.
 */

export interface PieceSet {
  name: string;
  path: string;
}

export const pieceSets: PieceSet[] = [
  { name: 'Normal', path: 'normal' },
  { name: 'Cats', path: 'cats' },
];

let currentSetIndex = 0;

const pieceImageUrls: Record<string, Record<string, string>> = {
  normal: {
    white_pawn: new URL('../../../assets/chess_pieces/normal/white_pawn.png', import.meta.url).href,
    white_knight: new URL('../../../assets/chess_pieces/normal/white_knight.png', import.meta.url).href,
    white_bishop: new URL('../../../assets/chess_pieces/normal/white_bishop.png', import.meta.url).href,
    white_rook: new URL('../../../assets/chess_pieces/normal/white_rook.png', import.meta.url).href,
    white_queen: new URL('../../../assets/chess_pieces/normal/white_queen.png', import.meta.url).href,
    white_king: new URL('../../../assets/chess_pieces/normal/white_king.png', import.meta.url).href,
    black_pawn: new URL('../../../assets/chess_pieces/normal/black_pawn.png', import.meta.url).href,
    black_knight: new URL('../../../assets/chess_pieces/normal/black_knight.png', import.meta.url).href,
    black_bishop: new URL('../../../assets/chess_pieces/normal/black_bishop.png', import.meta.url).href,
    black_rook: new URL('../../../assets/chess_pieces/normal/black_rook.png', import.meta.url).href,
    black_queen: new URL('../../../assets/chess_pieces/normal/black_queen.png', import.meta.url).href,
    black_king: new URL('../../../assets/chess_pieces/normal/black_king.png', import.meta.url).href,
  },
  cats: {
    white_pawn: new URL('../../../assets/chess_pieces/cats/white_pawn.png', import.meta.url).href,
    white_knight: new URL('../../../assets/chess_pieces/cats/white_knight.png', import.meta.url).href,
    white_bishop: new URL('../../../assets/chess_pieces/cats/white_bishop.png', import.meta.url).href,
    white_rook: new URL('../../../assets/chess_pieces/cats/white_rook.png', import.meta.url).href,
    white_queen: new URL('../../../assets/chess_pieces/cats/white_queen.png', import.meta.url).href,
    white_king: new URL('../../../assets/chess_pieces/cats/white_king.png', import.meta.url).href,
    black_pawn: new URL('../../../assets/chess_pieces/cats/black_pawn.png', import.meta.url).href,
    black_knight: new URL('../../../assets/chess_pieces/cats/black_knight.png', import.meta.url).href,
    black_bishop: new URL('../../../assets/chess_pieces/cats/black_bishop.png', import.meta.url).href,
    black_rook: new URL('../../../assets/chess_pieces/cats/black_rook.png', import.meta.url).href,
    black_queen: new URL('../../../assets/chess_pieces/cats/black_queen.png', import.meta.url).href,
    black_king: new URL('../../../assets/chess_pieces/cats/black_king.png', import.meta.url).href,
  },
};

/**
 * Get the URL for a given piece in the current set.
 */
export function getPieceImageUrl(piece: { type: string; color: string }): string {
  const set = pieceSets[currentSetIndex];
  const key = `${piece.color}_${piece.type}`;
  return pieceImageUrls[set.path]?.[key] || '';
}

/**
 * Cycle to the next piece set.
 */
export function nextPieceSet(): void {
  currentSetIndex = (currentSetIndex + 1) % pieceSets.length;
}

/**
 * Get the current piece set.
 */
export function getCurrentPieceSet(): PieceSet {
  return pieceSets[currentSetIndex];
}
