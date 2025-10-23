import React from 'react';
import styles from './Commentary.module.css';
import type { Move } from '../app/page';

type CommentaryProps = {
  moves: Move[];
  isGameOver: boolean;
  winner?: string | null;
};

const positionNames = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right'
];

const getMoveCommentary = (move: Move, moveIndex: number, allMoves: Move[]): string => {
  const position = positionNames[move.position];
  const moveNum = moveIndex + 1;
  
  // Opening moves
  if (moveNum === 1) {
    if (move.position === 4) return `🎯 ${move.player} takes the center! A strong opening move that controls the board.`;
    if ([0, 2, 6, 8].includes(move.position)) return `📐 ${move.player} claims a corner position. Classic opening strategy for maximum control.`;
    return `📍 ${move.player} starts with an edge position. An unconventional but interesting opening!`;
  }
  
  if (moveNum === 2) {
    if (move.position === 4) return `🎯 ${move.player} also goes for center! The battle for board control begins.`;
    if ([0, 2, 6, 8].includes(move.position)) return `📐 ${move.player} takes another corner. Good defensive positioning against the center.`;
    return `📍 ${move.player} chooses an edge position. Building a different strategy.`;
  }
  
  // Mid-game analysis
  if (moveNum >= 3 && moveNum <= 6) {
    // Check for winning opportunities
    const isWinningMove = checkWinningMove(move, allMoves);
    if (isWinningMove) return `⚡ ${move.player} makes a strategic move to ${position}! This could be the decisive play.`;
    
    // Check for blocking moves
    const isBlockingMove = checkBlockingMove(move, allMoves);
    if (isBlockingMove) return `🛡️ ${move.player} blocks a potential threat at ${position}. Excellent defensive awareness!`;
    
    // Check for fork opportunities
    const isForkMove = checkForkMove(move, allMoves);
    if (isForkMove) return `🍴 ${move.player} creates a fork opportunity at ${position}! This creates multiple winning paths.`;
    
    return `🎮 ${move.player} plays at ${position}. The tactical battle continues!`;
  }
  
  // End game
  if (moveNum >= 7) {
    const isEndgameMove = checkEndgameMove(move, allMoves);
    if (isEndgameMove) return `🏁 ${move.player} makes a crucial endgame move at ${position}! Every move counts now.`;
    return `🏁 ${move.player} makes move ${moveNum} at ${position}. The endgame is here!`;
  }
  
  return `📍 ${move.player} plays at ${position}.`;
};

const checkWinningMove = (move: Move, allMoves: Move[]): boolean => {
  // This is a simplified check - in a real implementation, you'd analyze the board state
  // For now, we'll just check if it's a center or corner move in early game
  return move.position === 4 || [0, 2, 6, 8].includes(move.position);
};

const checkBlockingMove = (move: Move, allMoves: Move[]): boolean => {
  // Simplified check for blocking moves
  return move.moveNumber >= 3 && move.moveNumber <= 5;
};

const checkForkMove = (move: Move, allMoves: Move[]): boolean => {
  // Check if this move creates a fork (simplified)
  return move.position === 4 && move.moveNumber >= 3;
};

const checkEndgameMove = (move: Move, allMoves: Move[]): boolean => {
  // Check if this is a critical endgame move
  return move.moveNumber >= 7 && (move.position === 4 || [0, 2, 6, 8].includes(move.position));
};

export default function Commentary({ moves, isGameOver, winner }: CommentaryProps) {
  const getGameSummary = () => {
    if (!isGameOver) return null;
    
    if (winner) {
      const moveCount = moves.length;
      const winnerMoves = moves.filter(move => move.player === winner).length;
      return `🏆 Game Over! ${winner} wins in ${moveCount} moves with ${winnerMoves} strategic plays!`;
    }
    return `🤝 It's a draw! Both players fought valiantly in ${moves.length} moves.`;
  };

  return (
    <div className={styles.commentary}>
      <div className={styles.header}>
        <h3>📝 Move Commentary</h3>
        {isGameOver && (
          <div className={styles.summary}>
            {getGameSummary()}
          </div>
        )}
      </div>
      
      <div className={styles.movesList}>
        {moves.length === 0 ? (
          <div className={styles.emptyState}>
            <p>🎮 Game commentary will appear here as you play!</p>
            <p>Each move will be analyzed with strategic insights.</p>
          </div>
        ) : (
          moves.map((move, index) => (
            <div key={move.timestamp.getTime()} className={styles.moveItem}>
              <div className={styles.moveHeader}>
                <span className={styles.moveNumber}>Move {move.moveNumber}</span>
                <span className={`${styles.player} ${move.player === 'X' ? styles.playerX : styles.playerO}`}>
                  {move.player}
                </span>
                <span className={styles.timestamp}>
                  {move.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className={styles.commentaryText}>
                {getMoveCommentary(move, index, moves)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
