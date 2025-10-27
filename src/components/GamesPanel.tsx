"use client";
import React, { useEffect, useState } from 'react';
import { getAllGames, saveGames, getGame, saveGame } from '../utils/indexeddb';
import type { Move } from '../app/page';

type GameRecord = {
  id: string;
  name?: string;
  players: string[];
  moves: Array<{ player: string; index: number; commentary?: string; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export default function GamesPanel({ onLoadReplay, currentMoves }: { onLoadReplay: (moves: Move[]) => void; currentMoves: Move[] }) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshLocal();
  }, []);

  async function refreshLocal() {
    try {
      const local = await getAllGames();
      setGames(local || []);
    } catch (e) {
      // ignore
    }
  }

  // Save current moves locally to IndexedDB and refresh list
  async function saveCurrentLocally() {
    if (!currentMoves || currentMoves.length === 0) return alert('No moves to save');
    const players = Array.from(new Set(currentMoves.map((m) => m.player))).slice(0, 2);
    const now = new Date();
    const createdAt = now.toISOString();
    const defaultName = `${players.join(' vs ') || 'Game'} — ${now.toLocaleString()}`;
    const name = saveName && saveName.trim().length > 0 ? saveName.trim() : defaultName;
    const gameRecord = {
      id: `local-${Date.now()}`,
      name,
      players,
      moves: currentMoves.map((m) => ({ player: m.player, index: m.position, createdAt: m.timestamp?.toString() })),
      createdAt,
      updatedAt: createdAt,
    };
    try {
      // use saveGame helper to persist single record
      await saveGame(gameRecord);
      await refreshLocal();
      setSaveName('');
      alert('Saved locally');
    } catch (err) {
      console.error(err);
      alert('Failed to save locally');
    }
  }

  async function handleLoad(id: string) {
    const g = await getGame(id);
    if (!g) return alert('Game not found');
    // map backend moves to frontend Move[]
    const moves: Move[] = (g.moves || []).map((m: any, idx: number) => ({ player: m.player, position: m.index, timestamp: new Date(m.createdAt || Date.now()), moveNumber: idx + 1 }));
    onLoadReplay(moves);
  }

  return (
    <aside style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, width: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Saved Games</h3>
        <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand' : 'Collapse'}>{collapsed ? '▾' : '▴'}</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <input aria-label="save name" placeholder="Optional name for this game" value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ flex: 1, padding: 6, minWidth: '100px' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveCurrentLocally} disabled={currentMoves.length === 0}>Save</button>
          <button onClick={refreshLocal}>Refresh</button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ marginTop: 12, maxHeight: 260, overflowY: 'auto' }}>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {games.filter(g => g.name && g.name.trim() !== '').length === 0 && <li>No saved games with names</li>}
            {games
              .filter(g => g.name && g.name.trim() !== '')
              .map((g) => (
                <li key={g.id} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{g.createdAt ? new Date(g.createdAt).toLocaleString() : ''}</div>
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
