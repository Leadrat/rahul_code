 "use client";
 import React, { useEffect, useState } from 'react';
 import type { Move } from '../app/page';
 import type { Player } from './types';

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
  const moves: Move[] = (g.moves || []).map((m: any, idx: number) => ({ player: m.player, position: m.index, commentary: m.commentary, timestamp: new Date(m.createdAt || Date.now()), moveNumber: idx + 1 }));
      onLoadReplay(moves);
    } catch (err) {
      console.error(err);
      alert('Failed to load game');
    }
  }

  return (
    <aside style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, width: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Saved Games</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {stats && (
            <div style={{ fontSize: 12, color: '#999' }}>
              Wins: <strong style={{ color: '#10b981' }}>{stats.wins}</strong> &nbsp; Draws: <strong style={{ color: '#f59e0b' }}>{stats.draws}</strong> &nbsp; Losses: <strong style={{ color: '#ef4444' }}>{stats.losses}</strong>
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
                </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
