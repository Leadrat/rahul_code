 "use client";
 import React, { useEffect, useState } from 'react';
import type { Move } from '../app/page';
import type { Player, SquareValue } from './types';
import Board from './Board';

type GameRecord = {
  id: string;
  name?: string;
  players: string[];
  moves: Array<{ player: string; index: number; commentary?: string; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
};

export default function GamesPanel({ onLoadReplay, currentMoves, winner, humanPlayer, refreshSignal, endSignal, resultDelta }: { onLoadReplay: (moves: Move[]) => void; currentMoves: Move[]; winner?: Player | null; humanPlayer?: Player; refreshSignal?: number; endSignal?: number; resultDelta?: { wins: number; losses: number; draws: number } | null }) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // save input moved to parent sidebar
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<{ wins: number; losses: number; draws: number; total: number } | null>(null);
  const [inlineReplayId, setInlineReplayId] = useState<string | null>(null);
  const [inlineReplaySquares, setInlineReplaySquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [inlineReplayMoves, setInlineReplayMoves] = useState<Move[] | null>(null);
  const [inlineReplayIndex, setInlineReplayIndex] = useState(0);
  const [inlineReplayTimerId, setInlineReplayTimerId] = useState<number | null>(null);

  useEffect(() => {
    refreshFromServer();
  }, []);

  // refresh when parent triggers
  useEffect(() => {
    if (typeof refreshSignal !== 'undefined') refreshFromServer();
  }, [refreshSignal]);

  // Update local stats when parent signals a game end (so wins/losses/draws update immediately)
  useEffect(() => {
    if (typeof endSignal === 'undefined') return;
    if (!resultDelta) return;
    setStats((prev) => {
      const prevWins = Number(prev?.wins) || 0;
      const prevLosses = Number(prev?.losses) || 0;
      const prevDraws = Number(prev?.draws) || 0;
      const prevTotal = Number(prev?.total) || prevWins + prevLosses + prevDraws;

      const newWins = prevWins + (Number(resultDelta.wins) || 0);
      const newLosses = prevLosses + (Number(resultDelta.losses) || 0);
      const newDraws = prevDraws + (Number(resultDelta.draws) || 0);
      const newTotal = prevTotal + (Number(resultDelta.wins) || 0) + (Number(resultDelta.losses) || 0) + (Number(resultDelta.draws) || 0);

      return { wins: newWins, losses: newLosses, draws: newDraws, total: newTotal };
    });
  }, [endSignal]);

  async function refreshFromServer() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
    if (!token) {
      setGames([]);
      return;
    }
    try {
      const res = await fetch('http://localhost:4001/api/games', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch games', res.statusText);
        setGames([]);
        return;
      }
      const body = await res.json();
      setGames(body.games || []);
      // also try fetch stats
      try {
        const statsRes = await fetch('http://localhost:4001/api/games/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (statsRes.ok) {
          const statsBody = await statsRes.json();
          // Normalize stats to numbers in case the API returns strings
          const parsed = {
            wins: Number(statsBody.wins) || 0,
            losses: Number(statsBody.losses) || 0,
            draws: Number(statsBody.draws) || 0,
            total: Number(statsBody.total) || (Number(statsBody.wins) || 0) + (Number(statsBody.losses) || 0) + (Number(statsBody.draws) || 0),
          };
          setStats(parsed);
        }
      } catch (e) {
        // ignore stats errors
      }
    } catch (err) {
      console.error(err);
      setGames([]);
    }
  }

  // Save handled by parent; GamesPanel no longer exposes save controls.

  async function handleLoad(id: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
    if (!token) return alert('You must be logged in to replay saved games');
    try {
      const res = await fetch(`http://localhost:4001/api/games/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return alert('Game not found');
      const body = await res.json();
      const g = body.game;

      // Create mapping from player emails to symbols (X/O)
      const players = Array.isArray(g.players) ? g.players : [];
      const emailToSymbol: Record<string, Player> = {};
      if (players.length > 0) {
        const p0 = players[0] && String(players[0]).toLowerCase();
        const p1 = players[1] && String(players[1]).toLowerCase();
        if (p0) emailToSymbol[p0] = 'X';
        if (p1) emailToSymbol[p1] = 'O';
      }

      const moves: Move[] = (g.moves || []).map((m: any, idx: number) => {
        const playerEmail = String(m.player).toLowerCase();
        const playerSymbol = emailToSymbol[playerEmail] || (idx % 2 === 0 ? 'X' : 'O'); // fallback to alternating X/O based on move index if mapping fails
        return { player: playerSymbol, position: m.index, commentary: m.commentary, timestamp: new Date(m.createdAt || Date.now()), moveNumber: idx + 1 };
      });
      // start inline replay under the clicked row
      startInlineReplay(String(id), moves);
      // also notify parent if they want to load the main replay area
      if (onLoadReplay) onLoadReplay(moves);
    } catch (err) {
      console.error(err);
      alert('Failed to load game');
    }
  }

  function clearInlineReplay() {
    if (inlineReplayTimerId) {
      window.clearInterval(inlineReplayTimerId as unknown as number);
      setInlineReplayTimerId(null);
    }
    setInlineReplayId(null);
    setInlineReplayMoves(null);
    setInlineReplayIndex(0);
    setInlineReplaySquares(Array(9).fill(null));
  }

  function startInlineReplay(id: string, moves: Move[], speed = 600) {
    // stop any existing inline replay first
    clearInlineReplay();
  setInlineReplayId(String(id));
    setInlineReplayMoves(moves);
    setInlineReplaySquares(Array(9).fill(null));
    setInlineReplayIndex(0);
    let idx = 0;
    const idt = window.setInterval(() => {
      if (idx >= moves.length) {
        window.clearInterval(idt);
        setInlineReplayTimerId(null);
        return;
      }
      const m = moves[idx];
      setInlineReplaySquares((prev) => {
        const next = prev.slice();
        next[m.position] = m.player as any;
        return next;
      });
      idx += 1;
      setInlineReplayIndex(idx);
    }, speed) as unknown as number;
  setInlineReplayTimerId(idt);
  }

  return (
    <aside style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, width: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: "white" }}>Saved Games</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {stats && (
            <div style={{ fontSize: 12, color: '#cac4c4ff' }}>
              Wins: <strong style={{ color: '#aff4ddff' }}>{stats.wins}</strong> &nbsp; Draws: <strong style={{ color: '#ebd2a8ff' }}>{stats.draws}</strong> &nbsp; Losses: <strong style={{ color: '#f1a1a1ff' }}>{stats.losses}</strong>
            </div>
          )}
          <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand' : 'Collapse'}>{collapsed ? '▾' : '▴'}</button>
        </div>
      </div>

      

      {!collapsed && (
        <div style={{ marginTop: 12, maxHeight: 260, overflowY: 'auto' }}>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {games.length === 0 && <li>No saved games</li>}
            {games.map((g) => (
                <li key={g.id} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700 }}>{g.name || `${g.players?.join(' vs ') || 'Game'}`}</div>
                    <div style={{ fontSize: 11, color: '#ccc' }}>{g.created_at ? new Date(g.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button onClick={() => handleLoad(g.id)}>Replay</button>
                    <button onClick={() => setExpanded((ex) => ({ ...ex, [g.id]: !ex[g.id] }))}>{expanded[g.id] ? 'Hide moves' : 'Show moves'}</button>
                  </div>
                    {expanded[g.id] && (
                    <div style={{ marginTop: 8, paddingLeft: 8 }}>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {(g.moves || []).map((m, i) => (
                          <li key={i} style={{ fontSize: 13 }}>
                          {`${i + 1}. ${m.player} @ ${m.index} ${m.createdAt ? '(' + new Date(m.createdAt).toLocaleTimeString() + ')' : ''}`}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                    {/* Inline replay UI inserted directly below the row when active */}
                    {inlineReplayId === String(g.id) && (
                      <div style={{ marginTop: 12, padding: 8, border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ color: '#fff' }}><strong>Replaying: {g.name || g.players?.join(' vs ')}</strong></div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => clearInlineReplay()}>Stop</button>
                          </div>
                        </div>
                        <Board squares={inlineReplaySquares} onSquareClick={() => { /* noop replay */ }} isLocked highlightLine={null} />
                        <div style={{ marginTop: 8, color: '#ddd', fontSize: 13 }}>
                          Step: {inlineReplayIndex}/{(inlineReplayMoves && inlineReplayMoves.length) || 0}
                        </div>
                      </div>
                    )}
                </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
