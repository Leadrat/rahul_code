"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

interface GameType {
  id: string;
  player1_email: string;
  player2_email: string;
  winner_email: string | null;
  status: string;
  created_at: string;
}

interface UserStats {
  total: number;
  wins: number;
  draws: number;
  losses: number;
}

interface UserType {
  id: string;
  email: string;
  created_at: string;
  online: boolean;
  stats: UserStats;
}

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('tictactoe:adminToken') : null);
  const [userToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null);
  const [users, setUsers] = useState<UserType[] | null>(null);
  const [games, setGames] = useState<GameType[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedUserGames, setSelectedUserGames] = useState<any[] | null>(null);
  const [selectedReplay, setSelectedReplay] = useState<any | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [loading, setLoading] = useState(false);

  async function login(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      const res = await fetch(`${backend}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) throw new Error('login failed');
      const body = await res.json();
      setToken(body.token);
      localStorage.setItem('tictactoe:adminToken', body.token);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const authToken = token || userToken;
      if (!authToken) return alert('Login first');
      
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      
      // Fetch users and games in parallel
      const [usersRes, gamesRes] = await Promise.all([
        fetch(`${backend}/api/admin/players`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`${backend}/api/admin/games`, { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!gamesRes.ok) throw new Error('Failed to fetch games');

      const [usersData, gamesData] = await Promise.all([
        usersRes.json(),
        gamesRes.json()
      ]);

      setUsers(usersData.users || []);
      setGames(gamesData.games || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserGames(userId: string) {
    setLoading(true);
    try {
      const authToken = token || userToken;
      if (!authToken) return alert('Login first');
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      const res = await fetch(`${backend}/api/admin/players/${userId}/games`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) throw new Error('failed to fetch user games');
      const body = await res.json();
      setSelectedUserGames(body.games || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch user games');
    } finally {
      setLoading(false);
    }
  }

  async function fetchGameById(gameId: string) {
    setLoading(true);
    try {
      const authToken = token || userToken;
      if (!authToken) return alert('Login first');
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      const res = await fetch(`${backend}/api/admin/games/${gameId}`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) throw new Error('failed to fetch game');
      const body = await res.json();
      setSelectedReplay(body.game || null);
      setReplayIndex(0);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch game');
    } finally {
      setLoading(false);
    }
  }

  async function deleteGame(gameId: string) {
    if (!confirm('Delete this saved game?')) return;
    setLoading(true);
    try {
      const authToken = token || userToken;
      if (!authToken) return alert('Login first');
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      const res = await fetch(`${backend}/api/admin/games/${gameId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) throw new Error('failed to delete');
      // refresh selected user's games
      if (selectedUser) await fetchUserGames(selectedUser.id);
      // also refresh global users list (stats)
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete game');
    } finally {
      setLoading(false);
    }
  }

  // simple replay: step through moves (if moves are stored in game.moves)
  useEffect(() => {
    let timer: any = null;
    if (isReplaying && selectedReplay && Array.isArray(selectedReplay.moves)) {
      timer = setInterval(() => {
        setReplayIndex((i) => {
          const next = i + 1;
          if (next >= selectedReplay.moves.length) {
            setIsReplaying(false);
            clearInterval(timer);
            return selectedReplay.moves.length - 1;
          }
          return next;
        });
      }, 700);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isReplaying, selectedReplay]);

  useEffect(() => {
    // If we don't have an admin token saved but the user is logged in, check if that user is the admin
    // and reuse the regular user token for admin access so the user is not asked to login again.
    const tryPromote = async () => {
      try {
        if (!token && userToken) {
          const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
          const res = await fetch(`${backend}/api/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
          if (res.ok) {
            const body = await res.json().catch(() => ({}));
            if (body && body.isAdmin) {
              // mark admin token and persist so future navigations won't prompt
              setToken(userToken);
              try { localStorage.setItem('tictactoe:adminToken', userToken); } catch (e) { /* ignore */ }
            }
          }
        }
      } catch (err) {
        // ignore
      }
    };
    tryPromote();
  }, []);

  useEffect(() => {
    if (token || userToken) {
      fetchData();
    }
  }, [token, userToken]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.heading} style={{ color: '#e9ecece2' }}>Admin Panel</h1>
      
      {!token && (
        <form onSubmit={login} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input 
              className={styles.input}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      )}

      {token && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              className={styles.button}
              onClick={() => { 
                localStorage.removeItem('tictactoe:adminToken'); 
                setToken(null); 
                setUsers(null); 
              }}
            >
              Logout
            </button>
            <button 
              className={styles.buttonSecondary} 
              onClick={() => fetchData()}
            >
              Refresh Data
            </button>
          </div>

          <div className={styles.grid}>
            {/* Players Section */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <h2>Players</h2>
                <span>{users?.length || 0} total</span>
              </div>
              
              {loading && <div>Loading...</div>}
              {!loading && users?.length === 0 && <div>No users</div>}
              
              {users && users.length > 0 && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Status</th>
                      <th>Games</th>
                      <th>Win/Draw/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedUser(user); fetchUserGames(user.id); }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontWeight: 600 }}>{user.email}</div>
                            <div style={{ color: '#6c757d', fontSize: 12 }}>joined {new Date(user.created_at).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.status}>
                            <span className={user.online ? styles.statusDotOnline : styles.statusDotOffline} />
                            {user.online ? 'Online' : 'Offline'}
                          </div>
                        </td>
                        <td>{user.stats.total}</td>
                        <td>
                          {user.stats.wins}/{user.stats.draws}/{user.stats.losses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Selected user's saved games */}
          {selectedUser && (
            <div style={{ marginTop: 20 }}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>
                  <h2>Saved Games for {selectedUser.email}</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className={styles.buttonSecondary} onClick={() => { setSelectedUser(null); setSelectedUserGames(null); setSelectedReplay(null); }}>Close</button>
                    <span>{selectedUserGames?.length || 0} saved</span>
                  </div>
                </div>

                {loading && <div>Loading...</div>}
                {!loading && selectedUserGames && selectedUserGames.length === 0 && <div>No saved games for this user</div>}

                {selectedUserGames && selectedUserGames.length > 0 && (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Players</th>
                          <th>Winner</th>
                          <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                      {selectedUserGames.map(g => (
                        <tr key={g.id}>
                          <td>{formatDate(g.created_at)}</td>
                          <td style={{ color: '#000' }}>{g.name || '—'}</td>
                          <td style={{ color: '#000' }}>{Array.isArray(g.players) ? g.players.join(' vs ') : (g.players || '')}</td>
                          <td style={{ color: '#000' }}>{g.winner ? <strong>{g.winner}</strong> : '—'}</td>
                          <td>
                            <button className={styles.button} onClick={() => fetchGameById(String(g.id))} style={{ marginRight: 8 }}>View / Replay</button>
                            <button className={styles.buttonSecondary} onClick={() => deleteGame(String(g.id))}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Replay viewer */}
              {selectedReplay && (
                <div className={styles.card} style={{ marginTop: 12 }}>
                  <div className={styles.cardTitle}>
                    <h3>Replay: {selectedReplay.id}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={styles.button} onClick={() => setIsReplaying(v => !v)}>{isReplaying ? 'Pause' : 'Play'}</button>
                      <button className={styles.buttonSecondary} onClick={() => { setSelectedReplay(null); setReplayIndex(0); setIsReplaying(false); }}>Close</button>
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 8 }}>Move {replayIndex + 1} / {Array.isArray(selectedReplay.moves) ? selectedReplay.moves.length : 0}</div>
                    <ol>
                      {(Array.isArray(selectedReplay.moves) ? selectedReplay.moves.slice(0, replayIndex + 1) : []).map((m: any, i: number) => (
                          <li key={i}>{m.player} → {String(m.index)}{m.commentary ? ' - ' + m.commentary : ''}</li>
                        ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
