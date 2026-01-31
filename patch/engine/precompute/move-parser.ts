/**
 * Move Parser
 *
 * Parses moves and extracts next positions using chess.js
 */

import { Chess } from 'chess.js';
import type { NextPosition } from './types';
import type { EngineLine } from '../types';

export class MoveParser {
  /**
   * Extract next positions from analysis result (horizontal expansion)
   * @param currentFEN Current position FEN
   * @param lines Analysis lines
   * @param maxLines Max lines to process (1-5)
   * @returns List of next positions
   */
  static extractNextPositions(
    currentFEN: string,
    lines: EngineLine[],
    maxLines: number = 5
  ): NextPosition[] {
    console.log(
      `[MOVE PARSER] Extracting next positions | ` +
      `FEN: ${currentFEN.slice(0, 30)}... | ` +
      `Lines: ${lines.length} | ` +
      `MaxLines: ${maxLines}`
    );

    const results: NextPosition[] = [];

    for (let i = 0; i < Math.min(maxLines, lines.length); i++) {
      const line = lines[i];

      if (!line.pv || line.pv.length === 0) {
        console.warn(`[MOVE PARSER] ⚠️ Line ${i + 1} has no PV moves`);
        continue;
      }

      try {
        const chess = new Chess(currentFEN);
        const firstMove = line.pv[0]; // UCI format: "e2e4"

        console.log(
          `[MOVE PARSER] Processing Line ${i + 1} | ` +
          `Move: ${firstMove} | ` +
          `PV length: ${line.pv.length} | ` +
          `Score: ${line.score}`
        );

        // chess.js supports UCI format
        const moveResult = chess.move(firstMove);

        if (!moveResult) {
          console.error(
            `[MOVE PARSER] ❌ Invalid move: ${firstMove} in ${currentFEN.slice(0, 30)}...`
          );
          continue;
        }

        const newFEN = chess.fen();

        results.push({
          fen: newFEN,
          fromFEN: currentFEN,
          move: firstMove,
          moveUCI: firstMove,
          moveSAN: moveResult.san,
          lineIndex: i,
          score: line.score,
          depth: 0, // Horizontal expansion
        });

        console.log(
          `[MOVE PARSER] ✓ Line ${i + 1} extracted | ` +
          `Move: ${moveResult.san} (${firstMove}) | ` +
          `New FEN: ${newFEN.slice(0, 30)}...`
        );

      } catch (error) {
        console.error(`[MOVE PARSER] ❌ Error parsing Line ${i + 1}:`, error);
      }
    }

    console.log(
      `[MOVE PARSER] ✓ Extraction complete | ` +
      `Extracted ${results.length} positions from ${lines.length} lines`
    );

    return results;
  }

  /**
   * Extract deep positions (vertical expansion)
   * @param currentFEN Current position FEN
   * @param pv Principal variation ["e2e4", "e7e5", "Ng1f3", ...]
   * @param depth How many moves to walk (1-3)
   * @returns List of positions at each depth
   */
  static extractDeepPositions(
    currentFEN: string,
    pv: string[],
    depth: number = 2
  ): NextPosition[] {
    console.log(
      `[MOVE PARSER] Extracting deep positions | ` +
      `FEN: ${currentFEN.slice(0, 30)}... | ` +
      `PV length: ${pv.length} | ` +
      `Target depth: ${depth}`
    );

    const results: NextPosition[] = [];
    const chess = new Chess(currentFEN);

    for (let i = 0; i < Math.min(depth, pv.length); i++) {
      const move = pv[i];

      try {
        const moveResult = chess.move(move);

        if (!moveResult) {
          console.warn(
            `[MOVE PARSER] ⚠️ Invalid deep move at depth ${i + 1}: ${move}`
          );
          break;
        }

        const newFEN = chess.fen();

        results.push({
          fen: newFEN,
          fromFEN: i === 0 ? currentFEN : results[i - 1].fen,
          move: move,
          moveUCI: move,
          moveSAN: moveResult.san,
          lineIndex: 0, // Always from first line in vertical
          score: null,
          depth: i + 1,
        });

        console.log(
          `[MOVE PARSER] ✓ Depth ${i + 1} extracted | ` +
          `Move: ${moveResult.san} (${move}) | ` +
          `FEN: ${newFEN.slice(0, 30)}...`
        );

      } catch (error) {
        console.error(
          `[MOVE PARSER] ❌ Error at depth ${i + 1}:`, error
        );
        break;
      }
    }

    console.log(
      `[MOVE PARSER] ✓ Deep extraction complete | ` +
      `Extracted ${results.length}/${depth} positions`
    );

    return results;
  }

  /**
   * Validate FEN string
   */
  static isValidFEN(fen: string): boolean {
    try {
      const chess = new Chess(fen);
      const normalized = chess.fen();
      const isValid = normalized.split(' ').slice(0, 4).join(' ') ===
                     fen.split(' ').slice(0, 4).join(' ');

      if (!isValid) {
        console.warn(`[MOVE PARSER] ⚠️ Invalid FEN: ${fen}`);
      }

      return isValid;
    } catch (error) {
      console.error(`[MOVE PARSER] ❌ FEN validation error:`, error);
      return false;
    }
  }

  /**
   * Parse move from UCI to SAN format
   */
  static uciToSAN(fen: string, uciMove: string): string | null {
    try {
      const chess = new Chess(fen);
      const move = chess.move(uciMove);
      return move ? move.san : null;
    } catch {
      return null;
    }
  }
}
