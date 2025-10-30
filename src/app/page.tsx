"use client";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Board from '../components/Board';
import Commentary, { generateCommentaryForMove } from '../components/Commentary';
import GamesPanel from '../components/GamesPanel';
import { useGameSocket } from '../utils/useGameSocket';
import Notifications from '../components/Notifications';
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
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const userEmailRef = useRef<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // attempt to extract email from JWT token stored in localStorage
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
      if (!token) return;
      const parts = token.split('.');
      if (parts.length < 2) return;
      const payload = parts[1];
      // base64url decode
      const json = decodeURIComponent(atob(payload.replace(/-/g, '+').replace(/_/g, '/')).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const data = JSON.parse(json);
      if (data?.email) setUserEmail(String(data.email));
    } catch (e) {
      // ignore
    }
  }, []);

  // keep a ref of userEmail for socket callbacks (avoids stale closures)
  useEffect(() => { userEmailRef.current = userEmail ? String(userEmail).toLowerCase() : null; }, [userEmail]);

  // load game state from backend and apply to UI (used when a game is created in DB)
  async function loadGameFromServer(gameId: string | null) {
    try {
      if (!gameId) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
  const backend = '/api';
      const res = await fetch(`${backend}/api/games/${encodeURIComponent(String(gameId))}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return;
      const body = await res.json().catch(() => null);
      const state = body && (body.game || body.state || body);
      if (!state) return;
      // apply moves to board
      const squaresArr = Array(9).fill(null) as SquareValue[];
      const moves = state.moves || [];
      moves.forEach((m: any) => {
        const mv = m.move || m;
        const pos = mv.position ?? mv.index ?? mv.idx;
        const sign = mv.sign ?? mv.player ?? mv.playerSign ?? null;
        if (typeof pos === 'number' && sign) squaresArr[pos] = sign;
      });
      setSquares(squaresArr);
      setMoveHistory(moves.map((m: any, idx: number) => ({ player: m.playerEmail || m.player || (m.move && m.move.player) || 'X', position: (m.move && (m.move.position ?? m.move.index)) ?? m.position ?? 0, timestamp: new Date(m.createdAt || m.at || Date.now()), moveNumber: idx + 1 })));
      // populate players if present
      if (state.players && Array.isArray(state.players) && state.players.length > 0) {
        // normalize players and build sign mapping: players[0] => X, players[1] => O
        const normalizedPlayers = state.players.map((p: any) => p && String(p).toLowerCase());
        setCurrentGamePlayers(normalizedPlayers);
        currentGamePlayersRef.current = normalizedPlayers;

        const last = moves.length ? moves[moves.length - 1] : null;
        const lastEmail = last && (last.playerEmail || last.player) ? String(last.playerEmail || last.player).toLowerCase() : null;
        const nextEmail = normalizedPlayers.find((p: any) => p !== lastEmail) || null;
        setCurrentGameNextEmail(nextEmail);

        // determine which sign is next based on number of moves (even => X, odd => O)
        const nextSign: Player = moves.length % 2 === 0 ? 'X' : 'O';
        setCurrentPlayer(nextSign);

        // set humanPlayer for the logged-in user if they are one of the players
        const me = userEmailRef.current;
        if (me) {
          const myIndex = normalizedPlayers.indexOf(me);
          if (myIndex === 0) setHumanPlayer('X');
          else if (myIndex === 1) setHumanPlayer('O');
        }
      }
    } catch (e) {
      // ignore load errors
    }
  }

  // verify user info with server to detect admin role
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
        if (!token) return;
  const backend = '/api';
        const res = await fetch(`${backend}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const body = await res.json().catch(() => ({}));
        if (body && body.isAdmin) setIsAdmin(true);
      } catch (err) {
        // ignore
      }
    })();
  }, [userEmail]);

  function handleLogout() {
    try { localStorage.removeItem('tictactoe:token'); } catch (e) { /* ignore */ }
    // navigate to login page
    router.push('/login');
  }

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileRef.current) return;
      const el = profileRef.current as unknown as HTMLElement;
      if (!el.contains(e.target as Node)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [profileOpen]);
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGamePlayers, setCurrentGamePlayers] = useState<string[] | null>(null);
  const currentGamePlayersRef = useRef<string[] | null>(null);
  const [showGameStart, setShowGameStart] = useState(false);
  const [gameStartPayload, setGameStartPayload] = useState<any | null>(null);
  const [currentGameNextEmail, setCurrentGameNextEmail] = useState<string | null>(null);
  const socketRef = useGameSocket({
    onInvite: (invite: any) => {
      setInvites((s) => [invite, ...s]);
    },
    onInviteStatus: (data: any) => {
      // eslint-disable-next-line no-console
      console.info('invite status', data);
    },
    onPresence: (p: any) => {
      // eslint-disable-next-line no-console
      console.info('presence changed', p);
    },
    onMove: (payload: any) => {
      try {
        const { gameId, state, move, playerEmail } = payload || {};
        if (!gameId || !state) return;
        // apply moves to board and map players to X/O
        const squaresArr = Array(9).fill(null) as SquareValue[];
        const moves = state.moves || [];
        const players = Array.isArray(state.players) ? state.players : [];
        const signMap: Record<string, Player> = {};
        if (players.length > 0) {
          const p0 = players[0] && String(players[0]).toLowerCase();
          const p1 = players[1] && String(players[1]).toLowerCase();
          if (p0) signMap[p0] = 'X';
          if (p1) signMap[p1] = 'O';
        }

        moves.forEach((m: any) => {
          const mv = m.move || m;
          const pos = mv.position ?? mv.index ?? mv.idx;
          let sign = mv.sign ?? mv.player ?? mv.playerSign ?? null;
          if (!sign && (m.playerEmail || mv.playerEmail)) {
            const email = String(m.playerEmail || mv.playerEmail).toLowerCase();
            sign = signMap[email] || null;
          }
          if (typeof pos === 'number' && sign) squaresArr[pos] = sign as any;
        });

        setSquares(squaresArr);
        setMoveHistory(moves.map((m: any, idx: number) => {
          const email = m.playerEmail || (m.move && m.move.player) || m.player || null;
          const emailNorm = email ? String(email).toLowerCase() : null;
          const playerSign = emailNorm && signMap[emailNorm] ? signMap[emailNorm] : (m.player || (m.move && m.move.player) || 'X');
          return { player: playerSign as Player, position: (m.move && (m.move.position ?? m.move.index)) ?? m.position ?? 0, timestamp: new Date(m.createdAt || m.at || Date.now()), moveNumber: idx + 1 };
        }));

        // populate players if present
        if (players && Array.isArray(players) && players.length > 0) {
          const normalizedPlayers = players.map((p: any) => p && String(p).toLowerCase());
          setCurrentGamePlayers(normalizedPlayers);
          currentGamePlayersRef.current = normalizedPlayers;
          const last = moves.length ? moves[moves.length - 1] : null;
          const lastEmail = last && (last.playerEmail || last.player);
          const next = players.find((p: any) => p !== lastEmail) || null;
          setCurrentGameNextEmail(next);
          // set currentPlayer to next sign based on moves count
          const nextSign: Player = moves.length % 2 === 0 ? 'X' : 'O';
          setCurrentPlayer(nextSign);
          // set humanPlayer if current user is one of the players
          const me = userEmailRef.current;
          if (me) {
            const myIndex = normalizedPlayers.indexOf(me);
            if (myIndex === 0) setHumanPlayer('X');
            else if (myIndex === 1) setHumanPlayer('O');
          }
        }
      } catch (e) {
        // ignore
      }
    },
    onGameState: (state: any) => {
      // eslint-disable-next-line no-console
      console.info('game state', state);
    }
    ,
    onGameStarted: (payload: any) => {
      try {
        const gid = payload && payload.gameId;
        if (!gid) return;
        const starter = payload && payload.startedBy && String(payload.startedBy).toLowerCase();
        const me = userEmailRef.current;
        // if I am the one who started the game (starter), auto-join. Otherwise show popup and let sender click Start.
        if (starter && me && starter === me) {
          const sock = socketRef.current;
          sock?.emit('game:join', { gameId: String(gid) });
          setCurrentGameId(String(gid));
          // load authoritative state from server DB if available
          loadGameFromServer(String(gid));
          setGameStartPayload(payload);
          setShowGameStart(true);
        } else {
          // show popup to prompt the other participant (sender) to start/join
          setGameStartPayload(payload);
          setShowGameStart(true);
        }
      } catch (e) { /* ignore */ }
    }
  });
  const [replayMode, setReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayIntervalId, setReplayIntervalId] = useState<number | null>(null);
  const [savedMoveHistory, setSavedMoveHistory] = useState<Move[] | null>(null);
  const [humanPlayer, setHumanPlayer] = useState<Player>('X');
  const [systemTimerId, setSystemTimerId] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');
  const [refreshSignal, setRefreshSignal] = useState(0);
  // automatic reporting of minimal results to server removed per UX request
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
    // NOTE: automatic reporting of results to the server has been disabled per UX.
  }, [isGameOver]);

  // NOTE: auto-save on game end disabled per UX request.
  // If auto-save is ever desired in the future, reintroduce logic here with
  // proper guards for replayMode and duplicate saves.

  function handleSquareClick(index: number) {
    // debug: log state to help diagnose input issues
    // eslint-disable-next-line no-console
    console.debug('handleSquareClick', { index, currentPlayer, humanPlayer, isGameOver, value: squares[index] });
    if (squares[index] !== null || isGameOver) return;

    // If connected to a multiplayer game, send move to server via socket
    const sock = socketRef.current;
    if (currentGameId && sock && sock.connected && userEmail) {
      const payload = { gameId: currentGameId, move: { position: index, sign: currentPlayer }, playerEmail: userEmail };
      sock.emit('move', payload);
      return; // wait for server to emit move:applied which will update UI
    }

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

  // NOTE: automatic persisting of in-progress games was removed per UX request.
  // Games are now saved only when the user explicitly clicks the Save button.

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
    // but skip auto-play when connected to a shared multiplayer game
    const human = newHumanPlayer ?? humanPlayer;
    if (human === 'O' && !currentGameId) {
      const tid = window.setTimeout(() => {
        systemChooseAndPlay();
      }, 300) as unknown as number;
      setSystemTimerId(tid);
    }
  }

  // Start a fresh local game vs computer. Human plays as X, computer as O.
  function startNewLocalGame() {
    // Ensure we're not in a multiplayer session
    setCurrentGameId(null);
    setCurrentGamePlayers(null);
    currentGamePlayersRef.current = null;
    setCurrentGameNextEmail(null);
    setGameStartPayload(null);
    setShowGameStart(false);
    // set human to X and reset board accordingly
    setHumanPlayer('X');
    handleReset('X');
  }

  function stopReplay() {
    if (replayIntervalId) {
      window.clearInterval(replayIntervalId);
      setReplayIntervalId(null);
    }
    setReplayMode(false);
    setReplayIndex(0);
    // restore previous move history if we replaced it for replay
    if (savedMoveHistory) {
      setMoveHistory(savedMoveHistory);
      setSavedMoveHistory(null);
    }
  }

  function startReplay(moves: Move[], speed = 600) {
    // prepare for replay: save current move history, reset board and step through saved moves
    setSavedMoveHistory(moveHistory);
    handleReset();
    setReplayMode(true);
    setMoveHistory([]);
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
      // append to moveHistory so Commentary shows saved commentary step-by-step
      setMoveHistory((prev) => [...prev, m]);
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
    // disable system auto-play when playing a shared (multiplayer) game
    if (currentGameId) return;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div className={styles.title}>Tic Tac Toe</div>
                <div className={styles.subtitle}>Classic 3×3 Grid Game</div>
                <div className={styles.status}>{renderStatusText(status)}{currentGameNextEmail ? ` — Next: ${currentGameNextEmail}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* top-right fixed controls (notifications + admin) placed just left of avatar */}
                <div style={{ position: 'fixed', top: 12, right: 64, display: 'flex', gap: 12, alignItems: 'center', zIndex: 60 }}>
                  <div className={styles.notifNote} title="Invite friends to play via notifications">🔔 Invite friends to play on notification click</div>
                  <Notifications
                    invites={invites}
                    onAccept={async (inv: any) => {
                    try {
                      const token = localStorage.getItem('tictactoe:token');
                      const res = await fetch(`/api/invites/${inv.id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ response: 'accept' }) });
                      const body = await res.json().catch(() => ({}));
                      if (res.ok) {
                        setInvites((s) => s.filter(i => i.id !== inv.id));
                        const gid = body && (body.gameId || body.game_id);
                        if (gid) {
                          const sock = socketRef.current;
                          sock?.emit('game:join', { gameId: String(gid) });
                          setCurrentGameId(String(gid));
                          // load authoritative state from DB
                          loadGameFromServer(String(gid));
                        } else if (body && body.gameCreated === false && body.players) {
                          // couldn't auto-create; show the same game-start popup so the recipient or other player can start the game
                          setGameStartPayload({ inviteId: inv.id, players: body.players, startedBy: body.from_user_email || null });
                          setShowGameStart(true);
                        }
                      }
                    } catch (e) { /* ignore */ }
                  }}
                  onDecline={async (inv: any) => {
                    try {
                      const token = localStorage.getItem('tictactoe:token');
                      await fetch(`/api/invites/${inv.id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ response: 'decline' }) });
                      setInvites((s) => s.filter(i => i.id !== inv.id));
                    } catch (e) { }
                  }}
                  onSendInvite={async ({ toEmail, message }) => {
                    const token = localStorage.getItem('tictactoe:token');
                    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ toEmail, message }) });
                    if (!res.ok) throw new Error('invite failed');
                    const body = await res.json().catch(() => ({}));
                    // Do not add outgoing invites to the local notifications list — only receivers should see invites
                  }}
                  />
                  {/* Game started popup */}
                  {showGameStart && gameStartPayload && (() => {
                    const starter = gameStartPayload.startedBy && String(gameStartPayload.startedBy).toLowerCase();
                    const me = userEmailRef.current;
                    const isStarter = starter && me && starter === me;
                    return (
                      <div style={{ position: 'absolute', top: 56, right: 0, width: 320, background: 'var(--card-bg, #0b0b0b)', border: '1px solid rgba(255,255,255,0.06)', padding: 12, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>Game started</strong>
                            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{(gameStartPayload.players || []).join(' vs ')}</div>
                          </div>
                          <div>
                            <button onClick={() => setShowGameStart(false)} style={{ padding: '4px 8px' }}>Close</button>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          {isStarter ? (
                            <button onClick={async () => {
                              const sock = socketRef.current;
                              let gid = gameStartPayload.gameId;
                              const players = gameStartPayload.players || [];
                              // if a game wasn't created yet, try to create it via the invites start endpoint
                              if (!gid && gameStartPayload && gameStartPayload.inviteId) {
                                try {
                                  const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
                                  const res = await fetch(`/api/invites/${gameStartPayload.inviteId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
                                  const body = await res.json().catch(() => ({}));
                                  if (res.ok && body && (body.gameId || body.id)) {
                                    gid = body.gameId || body.id;
                                  }
                                } catch (e) { /* ignore start failure */ }
                              }
                              if (!gid) {
                                // can't proceed without a game id
                                alert('Failed to start game. Please try again.');
                                return;
                              }
                              // join room locally
                              sock?.emit('game:join', { gameId: String(gid) });
                              // load authoritative state from DB
                              loadGameFromServer(String(gid));
                              // notify server that we've opened the game UI so other players get prompted to join
                              sock?.emit('game:open', { gameId: String(gid), players });
                              setCurrentGameId(String(gid));
                              setShowGameStart(false);
                              // update URL so the game view is reflected in the address bar
                              try { router.push(`/?game=${encodeURIComponent(String(gid))}`); } catch (e) { /* ignore */ }
                            }} style={{ padding: '6px 10px' }}>Open Game</button>
                          ) : (
                            <button onClick={async () => {
                              const sock = socketRef.current;
                              let gid = gameStartPayload.gameId;
                              // if no gid but inviteId exists, try to start the game via API (sender allowed)
                              if (!gid && gameStartPayload && gameStartPayload.inviteId) {
                                try {
                                  const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
                                  const res = await fetch(`/api/invites/${gameStartPayload.inviteId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
                                  const body = await res.json().catch(() => ({}));
                                  if (res.ok && body && (body.gameId || body.id)) {
                                    gid = body.gameId || body.id;
                                  }
                                } catch (e) { /* ignore */ }
                              }
                              if (!gid) {
                                alert('Failed to join game. Please try again.');
                                return;
                              }
                              sock?.emit('game:join', { gameId: String(gid) });
                              // load authoritative state from DB
                              loadGameFromServer(String(gid));
                              setCurrentGameId(String(gid));
                              setShowGameStart(false);
                            }} style={{ padding: '6px 10px' }}>Start</button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {userEmail && isAdmin && (
                    <a href="/admin"><button style={{ padding: '6px 10px' }}>Admin</button></a>
                  )}
                </div>
                {userEmail ? (
                  <div ref={profileRef} className="profile profile-fixed">
                    <button aria-label="Profile" onClick={() => setProfileOpen((s) => !s)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <div className="avatar" title={userEmail} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontWeight: 700 }}>{userEmail.charAt(0).toUpperCase()}</div>
                    </button>
                    {profileOpen && (
                      <div className="profile-dropdown" style={{ position: 'absolute', right: 0, marginTop: 8, minWidth: 180, zIndex: 40 }}>
                        <div style={{ padding: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{userEmail}</div>
                        </div>
                        <div style={{ padding: 8 }}>
                          <button onClick={() => handleLogout()} style={{ width: '100%', padding: '8px 10px' }}>Logout</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <a href="/login"><button style={{ padding: '6px 10px' }}>Sign in</button></a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <Board
                squares={squares}
                onSquareClick={handleSquareClick}
                isLocked={isGameOver || replayMode || currentPlayer !== humanPlayer}
                highlightLine={winningLine}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 420 }}>
                <div className={styles.actions}>
                  <button className={styles.reset} onClick={() => startNewLocalGame()} type="button">
                    🔄 New Game
                  </button>
                </div>
                <div style={{ marginTop: 8, border: '1px solid rgba(0,0,0,0.08)', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ marginBottom: 6 }}><strong>Save current game</strong></div>
                  <input placeholder="Optional name" value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 6, border: '1px solid #ddd', color: "#fcfcfc64" }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                      // manual save (only allowed when game has ended and not during replay)
                      if (replayMode) return alert('Cannot save during replay');
                      if (!moveHistory || moveHistory.length === 0) return alert('No moves to save');
                      if (!isGameOver) return alert('You can only save after the game has ended');
                      const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
                      if (!token) return alert('You must be logged in to save games');
                      // For shared games prefer server-side player emails when available
                      const players = (currentGamePlayersRef.current && currentGamePlayersRef.current.length > 0)
                        ? currentGamePlayersRef.current.slice(0, 2)
                        : Array.from(new Set(moveHistory.map((m) => m.player))).slice(0, 2);
                      const now = new Date();
                      const defaultName = `${players.join(' vs ') || 'Game'} — ${now.toLocaleString()}`;
                      const name = saveName && saveName.trim().length > 0 ? saveName.trim() : defaultName;
                      // include commentary for each move (use existing commentary if present, otherwise generate)
                      // If this is a shared game, map move players and winner from X/O to email addresses
                      const signMap: Record<string, string> = {};
                      if (players && players.length > 0) {
                        if (players[0]) signMap['X'] = players[0];
                        if (players[1]) signMap['O'] = players[1];
                      }

                      const movesPayload = moveHistory.map((m, idx) => {
                        // prefer mapping sign to email when available
                        const rawPlayer = m.player;
                        const mappedPlayer = (rawPlayer && signMap[rawPlayer]) ? signMap[rawPlayer] : rawPlayer;
                        return { player: mappedPlayer, index: m.position, commentary: m.commentary || generateCommentaryForMove(m, idx, moveHistory), createdAt: m.timestamp.toISOString() };
                      });

                      let winnerVal: any = null;
                      if (status.type === 'winner') {
                        const rawWinner = status.player;
                        winnerVal = (rawWinner && signMap[rawWinner]) ? signMap[rawWinner] : rawWinner;
                      }

                      const payload = {
                        name,
                        players,
                        HumanPlayer: humanPlayer,
                        Moves: movesPayload,
                        Winner: winnerVal,
                      };
                      try {
                        const res = await fetch('/api/games', {
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
