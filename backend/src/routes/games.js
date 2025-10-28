const express = require('express');
const { query } = require('../db');

const router = express.Router();

// POST /api/games - create a new saved game for current user
router.post('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const { name, players, moves, winner, human_player } = req.body || {};
    const sql = `INSERT INTO games(user_id, name, players, human_player, moves, winner) VALUES($1, $2, $3, $4, $5::jsonb, $6) RETURNING id, name, players, human_player, moves, winner, created_at`;
    const params = [userId, name || null, players || null, human_player || null, JSON.stringify(moves || []), winner || null];
    const result = await query(sql, params);
    return res.status(201).json({ game: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// POST /api/games/result - record a game result (minimal entry, used to update stats without saving full replay)
router.post('/result', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const { players, winner, human_player } = req.body || {};
    // store a minimal game record (empty moves) so stats computed from games include this result
    const sql = `INSERT INTO games(user_id, name, players, human_player, moves, winner) VALUES($1, $2, $3, $4, $5::jsonb, $6) RETURNING id, name, players, human_player, moves, winner, created_at`;
    const params = [userId, null, players || null, human_player || null, JSON.stringify([]), winner || null];
    const result = await query(sql, params);
    return res.status(201).json({ game: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/games - list current user's games
router.get('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const sql = 'SELECT id, name, players, human_player, moves, winner, created_at FROM games WHERE user_id=$1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return res.json({ games: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/games/:id - get a specific game (only if belongs to user)
// GET /api/games/stats - return wins/losses/draws for the current user
router.get('/stats', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN winner = human_player THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE WHEN winner IS NULL THEN 1 ELSE 0 END), 0) AS draws,
        COALESCE(SUM(CASE WHEN winner IS NOT NULL AND winner <> human_player THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(COUNT(*), 0) AS total
      FROM games
      WHERE user_id = $1
    `;
    const result = await query(sql, [userId]);
    return res.json(result.rows[0] || { wins: 0, draws: 0, losses: 0, total: 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/games/:id - get a specific game (only if belongs to user)
router.get('/:id', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    // allow access if the requesting user is the owner OR is one of the players
    // first get the user's email
    const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
    const userEmail = ures.rows[0] && ures.rows[0].email && String(ures.rows[0].email).toLowerCase();

    // fetch the game by id (without user restriction)
    const sql = 'SELECT id, user_id, name, players, human_player, moves, winner, created_at FROM games WHERE id=$1 LIMIT 1';
    const result = await query(sql, [req.params.id]);
    const game = result.rows[0];
    if (!game) return res.status(404).json({ message: 'not found' });

    // if requester is owner, allow
    if (game.user_id === userId) return res.json({ game });

    // otherwise check if user's email is in the players array
    try {
      const players = game.players || [];
      const normalized = (players || []).map(p => p && String(p).toLowerCase());
      if (userEmail && normalized.includes(userEmail)) {
        return res.json({ game });
      }
    } catch (e) {
      // fallback: deny
    }

    return res.status(403).json({ message: 'forbidden' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

module.exports = router;
