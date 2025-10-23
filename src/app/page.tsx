"use client";
import React, { useMemo, useState } from 'react';
import Board from '../components/Board';
import styles from '../components/Board.module.css';
import type { Player, SquareValue, GameStatus } from '../components/types';
import { calculateWinner } from '../components/types';

export default function HomePage() {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const status: GameStatus = useMemo(() => {
    const result = calculateWinner(squares);
    if (result) {
      return { type: 'winner', player: result.player, line: result.line };
    }
    if (squares.every((s) => s !== null)) {
      return { type: 'draw' } as const;
    }
    return { type: 'next', player: currentPlayer } as const;
  }, [squares, currentPlayer]);

  React.useEffect(() => {
    if (status.type === 'winner') {
      setIsGameOver(true);
      setWinningLine(status.line);
    } else if (status.type === 'draw') {
      setIsGameOver(true);
      setWinningLine(null);
    } else {
      setIsGameOver(false);
      setWinningLine(null);
    }
  }, [status]);

  function handleSquareClick(index: number) {
    if (squares[index] !== null || isGameOver) return;
    const next = squares.slice();
    next[index] = currentPlayer;
    setSquares(next);
    setCurrentPlayer((p) => (p === 'X' ? 'O' : 'X'));
  }

  function handleReset() {
    setSquares(Array(9).fill(null));
    setCurrentPlayer('X');
    setIsGameOver(false);
    setWinningLine(null);
  }

  function renderStatusText(s: GameStatus) {
    if (s.type === 'winner') return `Winner: ${s.player}`;
    if (s.type === 'draw') return 'Draw';
    return `Next: ${s.player}`;
  }

    return (
        <main className={styles.container}>
            <div className={styles.title}>Tic Tac Toe</div>
            <div className={styles.subtitle}>Classic 3×3 Grid Game</div>
            <div className={styles.status}>{renderStatusText(status)}</div>
            <Board
                squares={squares}
                onSquareClick={handleSquareClick}
                isLocked={isGameOver}
                highlightLine={winningLine}
            />
            <div className={styles.actions}>
                <button className={styles.reset} onClick={handleReset} type="button">
                    🔄 New Game
                </button>
            </div>
        </main>
    );
}
