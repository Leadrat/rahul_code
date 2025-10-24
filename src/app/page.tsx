"use client";
import React, { useMemo, useState } from 'react';
import Board from '../components/Board';
import Commentary from '../components/Commentary';
import GamesPanel from '../components/GamesPanel';
import { saveGame } from '../utils/indexeddb';
import styles from '../components/Board.module.css';
import type { Player, SquareValue, GameStatus } from '../components/types';
import { calculateWinner } from '../components/types';

export type Move = {
  player: Player;
  position: number;
  timestamp: Date;
  moveNumber: number;
};

export default function HomePage() {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [replayMode, setReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayIntervalId, setReplayIntervalId] = useState<number | null>(null);
  const [humanPlayer, setHumanPlayer] = useState<Player>('X');
  const [systemTimerId, setSystemTimerId] = useState<number | null>(null);

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
    
    // Track the move
    const newMove: Move = {
      player: currentPlayer,
      position: index,
      timestamp: new Date(),
      moveNumber: moveHistory.length + 1
    };
    setMoveHistory(prev => [...prev, newMove]);
    
    setCurrentPlayer((p) => (p === 'X' ? 'O' : 'X'));
  }

  // Persist the current in-progress game to local storage / IndexedDB whenever moves change
  React.useEffect(() => {
    if (moveHistory.length === 0) {
      // clear last-game in localStorage
      try { localStorage.removeItem('tictactoe:lastGame'); } catch (e) { /* ignore */ }
      return;
    }

    const players = Array.from(new Set(moveHistory.map((m) => m.player))).slice(0, 2);
    const now = new Date().toISOString();
    const gameRecord = {
      id: `local-${Date.now()}`,
      players,
      moves: moveHistory.map((m) => ({ player: m.player, index: m.position, createdAt: m.timestamp.toISOString() })),
      createdAt: now,
      updatedAt: now,
    };

    // save to localStorage for quick access
    try {
      localStorage.setItem('tictactoe:lastGame', JSON.stringify(gameRecord));
    } catch (e) {
      // ignore localStorage errors
    }

    // save to IndexedDB (async, fire-and-forget)
    saveGame(gameRecord).catch(() => { /* ignore */ });
  }, [moveHistory]);

  function handleReset() {
    setSquares(Array(9).fill(null));
    setCurrentPlayer('X');
    setIsGameOver(false);
    setWinningLine(null);
    setMoveHistory([]);
    stopReplay();
    if (systemTimerId) {
      window.clearTimeout(systemTimerId);
      setSystemTimerId(null);
    }
  }

  function stopReplay() {
    if (replayIntervalId) {
      window.clearInterval(replayIntervalId);
      setReplayIntervalId(null);
    }
    setReplayMode(false);
    setReplayIndex(0);
  }

  function startReplay(moves: Move[], speed = 600) {
    // reset board
    handleReset();
    setReplayMode(true);
    let idx = 0;
    const id = window.setInterval(() => {
      if (idx >= moves.length) {
        stopReplay();
        return;
      }
      const m = moves[idx];
      setSquares((prev) => {
        const next = prev.slice();
        next[m.position] = m.player;
        return next;
      });
      idx += 1;
      setReplayIndex(idx);
    }, speed);
    setReplayIntervalId(id);
  }

  // System (AI) move: pick a random empty square and play
  function systemChooseAndPlay() {
    if (isGameOver || replayMode) return;
    const empty = squares.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    if (empty.length === 0) return;
    const choice = empty[Math.floor(Math.random() * empty.length)];
    // small delay to make it feel natural
    const tid = window.setTimeout(() => {
      handleSquareClick(choice);
      setSystemTimerId(null);
    }, 400) as unknown as number;
    setSystemTimerId(tid);
  }

  // When currentPlayer changes and it's system's turn, trigger a system move
  React.useEffect(() => {
    if (replayMode) return;
    if (isGameOver) return;
    if (currentPlayer !== humanPlayer) {
      // schedule system move
      // clear any existing timer
      if (systemTimerId) {
        window.clearTimeout(systemTimerId);
        setSystemTimerId(null);
      }
      // add a short delay before system moves
      const tid = window.setTimeout(() => {
        systemChooseAndPlay();
      }, 300) as unknown as number;
      setSystemTimerId(tid);
    }
    return () => {
      if (systemTimerId) {
        window.clearTimeout(systemTimerId);
        setSystemTimerId(null);
      }
    };
  }, [currentPlayer, humanPlayer, isGameOver, replayMode]);

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

            <div style={{ display: 'flex', gap: 16 }}>
              <Board
                squares={squares}
                onSquareClick={handleSquareClick}
                isLocked={isGameOver || replayMode || currentPlayer !== humanPlayer}
                highlightLine={winningLine}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={styles.actions}>
                  <button className={styles.reset} onClick={handleReset} type="button">
                    🔄 New Game
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 6 }}><strong>Choose your side</strong></div>
                  <button onClick={() => { setHumanPlayer('X'); handleReset(); }} disabled={humanPlayer === 'X'}>Play as X</button>
                  <button onClick={() => { setHumanPlayer('O'); handleReset(); }} disabled={humanPlayer === 'O'} style={{ marginLeft: 8 }}>Play as O</button>
                </div>
                <div>
                  <button onClick={() => stopReplay()} disabled={!replayMode}>Stop Replay</button>
                </div>
                <GamesPanel onLoadReplay={(moves) => startReplay(moves)} currentMoves={moveHistory} />
              </div>
            </div>

            <Commentary 
                moves={moveHistory}
                isGameOver={isGameOver}
                winner={status.type === 'winner' ? status.player : null}
            />
        </main>
    );
}
