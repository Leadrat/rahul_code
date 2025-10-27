"use client";
import React, { useMemo, useState } from 'react';
import Board from '../components/Board';
import Commentary, { generateCommentaryForMove } from '../components/Commentary';
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
  commentary?: string;
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
  const [saveName, setSaveName] = useState('');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [autoSavedForMoves, setAutoSavedForMoves] = useState<number | null>(null);
  const [endSignal, setEndSignal] = useState(0);
  const [lastResultDelta, setLastResultDelta] = useState<{ wins: number; losses: number; draws: number } | null>(null);

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

  // Notify child panels when a game ends so they can update stats locally.
  React.useEffect(() => {
    if (!isGameOver) return;
    if (!moveHistory || moveHistory.length === 0) return;
    // compute result from human player's perspective
    const delta = { wins: 0, losses: 0, draws: 0 };
    if ((status.type === 'winner' && status.player === humanPlayer)) {
      delta.wins = 1;
    } else if (status.type === 'winner' && status.player !== humanPlayer) {
      delta.losses = 1;
    } else if (status.type === 'draw') {
      delta.draws = 1;
    }
    setLastResultDelta(delta);
    setEndSignal((s) => s + 1);
  }, [isGameOver]);

  // NOTE: auto-save on game end disabled per UX request.
  // If auto-save is ever desired in the future, reintroduce logic here with
  // proper guards for replayMode and duplicate saves.

  function handleSquareClick(index: number) {
    // debug: log state to help diagnose input issues
    // (kept lightweight - will remove after verification)
    // eslint-disable-next-line no-console
    console.debug('handleSquareClick', { index, currentPlayer, humanPlayer, isGameOver, value: squares[index] });
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
    
    // Check if this move results in a win or draw
    const result = calculateWinner(next);
    if (result) {
      setIsGameOver(true);
      setWinningLine(result.line);
      return; // End the game immediately when there's a winner
    }
    
    // Check for draw
    if (next.every(square => square !== null)) {
      setIsGameOver(true);
      return; // End the game immediately when it's a draw
    }
    
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
      moves: moveHistory.map((m, idx) => ({ player: m.player, index: m.position, commentary: m.commentary || generateCommentaryForMove(m, idx, moveHistory), createdAt: m.timestamp.toISOString() })),
      createdAt: now,
      updatedAt: now,
    };

    // save to localStorage for quick access
    try {
      localStorage.setItem('tictactoe:lastGame', JSON.stringify(gameRecord));
    } catch (e) {
      // ignore localStorage errors
    }

    // save to IndexedDB (async, fire-and-forget) - includes generated commentary so local saves include commentary
    saveGame(gameRecord).catch(() => { /* ignore */ });
  }, [moveHistory]);

  function handleReset(newHumanPlayer?: Player) {
    setSquares(Array(9).fill(null));
    setCurrentPlayer('X');
    setIsGameOver(false);
    setWinningLine(null);
    setMoveHistory([]);
    stopReplay();
    if (systemTimerId != null) {
      window.clearTimeout(systemTimerId);
      setSystemTimerId(null);
    }

    // If human player is O (consider override), trigger system move as X
    const human = newHumanPlayer ?? humanPlayer;
    if (human === 'O') {
      const tid = window.setTimeout(() => {
        systemChooseAndPlay();
      }, 300) as unknown as number;
      setSystemTimerId(tid);
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
  }, [currentPlayer, humanPlayer, isGameOver, replayMode, squares]);

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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 420 }}>
                <div className={styles.actions}>
                  <button className={styles.reset} onClick={() => handleReset()} type="button">
                    🔄 New Game
                  </button>
                </div>
                <div style={{ marginTop: 8, border: '1px solid rgba(0,0,0,0.08)', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ marginBottom: 6 }}><strong>Save current game</strong></div>
                  <input placeholder="Optional name" value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                      // manual save (only allowed when game has ended and not during replay)
                      if (replayMode) return alert('Cannot save during replay');
                      if (!moveHistory || moveHistory.length === 0) return alert('No moves to save');
                      if (!isGameOver) return alert('You can only save after the game has ended');
                      const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
                      if (!token) return alert('You must be logged in to save games');
                      const players = Array.from(new Set(moveHistory.map((m) => m.player))).slice(0, 2);
                      const now = new Date();
                      const defaultName = `${players.join(' vs ') || 'Game'} — ${now.toLocaleString()}`;
                      const name = saveName && saveName.trim().length > 0 ? saveName.trim() : defaultName;
                      // include commentary for each move (use existing commentary if present, otherwise generate)
                      const payload = {
                        name,
                        players,
                        human_player: humanPlayer,
                        moves: moveHistory.map((m, idx) => ({ player: m.player, index: m.position, commentary: m.commentary || generateCommentaryForMove(m, idx, moveHistory), createdAt: m.timestamp.toISOString() })),
                        winner: status.type === 'winner' ? status.player : null,
                      };
                      try {
                        const res = await fetch('http://localhost:4001/api/games', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) {
                          const body = await res.json().catch(() => ({}));
                          throw new Error(body?.message || 'Save failed');
                        }
                        setSaveName('');
                        setRefreshSignal((s) => s + 1);
                        alert('Saved');
                      } catch (err: any) {
                        // eslint-disable-next-line no-console
                        console.error(err);
                        alert(err?.message || 'Save failed');
                      }
                    }} disabled={!(isGameOver && moveHistory.length > 0)}>Save</button>
                    <button onClick={() => setRefreshSignal((s) => s + 1)}>Refresh</button>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 6 }}><strong>Choose your side</strong></div>
                  <button onClick={() => { 
                    // Set player selection - human is X, computer is O
                    setHumanPlayer('X'); 
                    // Reset the board and use override so reset logic uses the new selection immediately
                    handleReset('X');
                  }}>Play as X</button>
                  <button onClick={() => { 
                    // Set player selection - human is O, computer is X
                    setHumanPlayer('O'); 
                    // Reset and let handleReset schedule the computer's first move
                    handleReset('O');
                  }} style={{ marginLeft: 8 }}>Play as O</button>
                </div>
                <div>
                  <button onClick={() => stopReplay()} disabled={!replayMode}>Stop Replay</button>
                </div>
                
              </div>

              <GamesPanel onLoadReplay={(moves) => startReplay(moves)} currentMoves={moveHistory} winner={status.type === 'winner' ? status.player : null} humanPlayer={humanPlayer} refreshSignal={refreshSignal} endSignal={endSignal} resultDelta={lastResultDelta} />
            </div>

            <Commentary 
                moves={moveHistory}
                isGameOver={isGameOver}
                winner={status.type === 'winner' ? status.player : null}
            />
        </main>
    );
}
