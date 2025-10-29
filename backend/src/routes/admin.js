const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const authMiddleware = require('../middleware/auth');

// POST /api/admin/login - simple admin login using credentials in .env
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return res.status(500).json({ message: 'admin not configured' });
    if (email !== adminEmail || password !== adminPassword) return res.status(401).json({ message: 'invalid credentials' });
    const token = jwt.sign({ admin: true, email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/admin/players - list users and online status
// This route accepts either: (A) a special admin JWT (payload.admin===true) OR (B) a normal user JWT
// where the authenticated user's email matches ADMIN_EMAIL. That allows admin users who are
// already logged in as normal users to access the admin panel without a second login.
router.get('/players', authMiddleware, async (req, res) => {
  try {
    const jwtPayload = req.jwtPayload;
    const userId = req.userId;
    // allow admin token (jwtPayload.admin === true) or a normal user token with userId
    if (!userId && !(jwtPayload && jwtPayload.admin)) return res.status(401).json({ message: 'unauthorized' });

    // determine userEmail (from jwt admin token or by userId lookup)
    let userEmail = null;
    if (jwtPayload && jwtPayload.admin) {
      userEmail = jwtPayload.email;
    } else {
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
      userEmail = ures.rows[0] && ures.rows[0].email;
    }

    // allow if user's email matches ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: 'admin not configured' });
    if (String(userEmail).toLowerCase() !== String(adminEmail).toLowerCase()) return res.status(403).json({ message: 'forbidden' });

    const presence = req.app && req.app.get && req.app.get('presence');
    // Get user details with stats
    const userResult = await query(`
      SELECT
        u.id,
        u.email,
        u.created_at,
        COUNT(DISTINCT g.id) AS total_games,
        COUNT(DISTINCT CASE WHEN (
          (g.user_id = u.id AND g.winner = g.human_player)
          OR (g.winner = u.email)
        ) THEN g.id END) AS wins,
        COUNT(DISTINCT CASE WHEN g.winner IS NULL THEN g.id END) AS draws,
        COUNT(DISTINCT CASE WHEN (
          g.winner IS NOT NULL AND NOT (
            (g.user_id = u.id AND g.winner = g.human_player)
            OR (g.winner = u.email)
          )
        ) THEN g.id END) AS losses
      FROM users u
      LEFT JOIN games g ON (g.user_id = u.id OR u.email = ANY(g.players))
      GROUP BY u.id, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);

    const users = userResult.rows.map(u => {
      const emailKey = u.email ? String(u.email).toLowerCase() : null;
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        online: !!(presence && emailKey && presence[emailKey] && presence[emailKey].size > 0),
        stats: {
          total: parseInt(u.total_games) || 0,
          wins: parseInt(u.wins) || 0,
          draws: parseInt(u.draws) || 0,
          losses: parseInt(u.losses) || 0
        }
      };
    });

    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/admin/games - list all games
router.get('/games', authMiddleware, async (req, res) => {
  try {
    const jwtPayload = req.jwtPayload;
    const userId = req.userId;
    if (!userId && !(jwtPayload && jwtPayload.admin)) return res.status(401).json({ message: 'unauthorized' });

    let userEmail = null;
    if (jwtPayload && jwtPayload.admin) userEmail = jwtPayload.email;
    else {
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
      userEmail = ures.rows[0] && ures.rows[0].email;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: 'admin not configured' });
    if (String(userEmail).toLowerCase() !== String(adminEmail).toLowerCase()) return res.status(403).json({ message: 'forbidden' });

    const gamesResult = await query(`
      SELECT 
        g.id,
        g.players[1] as player1_email,
        g.players[2] as player2_email,
        g.winner as winner_email,
        g.moves,
        g.created_at,
        CASE 
          WHEN g.winner IS NOT NULL THEN 'completed'
          WHEN jsonb_array_length(COALESCE(g.moves, '[]'::jsonb)) >= 9 THEN 'completed'
          ELSE 'in_progress'
        END as status
      FROM games g
      ORDER BY g.created_at DESC
      LIMIT 100
    `);

    return res.json({ games: gamesResult.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/admin/players/:id/games - list saved games for a specific user
router.get('/players/:id/games', authMiddleware, async (req, res) => {
  try {
    const jwtPayload = req.jwtPayload;
    const userId = req.userId;
    if (!userId && !(jwtPayload && jwtPayload.admin)) return res.status(401).json({ message: 'unauthorized' });

    let userEmail = null;
    if (jwtPayload && jwtPayload.admin) userEmail = jwtPayload.email;
    else {
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
      userEmail = ures.rows[0] && ures.rows[0].email;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: 'admin not configured' });
    if (String(userEmail).toLowerCase() !== String(adminEmail).toLowerCase()) return res.status(403).json({ message: 'forbidden' });

    // fetch target user's email
    const pres = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [req.params.id]);
    const targetEmail = pres.rows[0] && pres.rows[0].email;
    if (!targetEmail) return res.status(404).json({ message: 'user not found' });

    const gamesResult = await query(`
      SELECT id, name, players, moves, winner, created_at
      FROM games
      WHERE $1 = ANY(players) OR user_id = $2
      ORDER BY created_at DESC
      LIMIT 200
    `, [targetEmail, req.params.id]);

    return res.json({ games: gamesResult.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/admin/games/:id - get a specific game by id (admin)
router.get('/games/:id', authMiddleware, async (req, res) => {
  try {
    const jwtPayload = req.jwtPayload;
    const userId = req.userId;
    if (!userId && !(jwtPayload && jwtPayload.admin)) return res.status(401).json({ message: 'unauthorized' });

    let userEmail = null;
    if (jwtPayload && jwtPayload.admin) userEmail = jwtPayload.email;
    else {
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
      userEmail = ures.rows[0] && ures.rows[0].email;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: 'admin not configured' });
    if (String(userEmail).toLowerCase() !== String(adminEmail).toLowerCase()) return res.status(403).json({ message: 'forbidden' });

    const result = await query('SELECT id, user_id, name, players, moves, winner, created_at FROM games WHERE id=$1 LIMIT 1', [req.params.id]);
    const game = result.rows[0];
    if (!game) return res.status(404).json({ message: 'not found' });
    return res.json({ game });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// DELETE /api/admin/games/:id - delete a saved game (admin)
router.delete('/games/:id', authMiddleware, async (req, res) => {
  try {
    const jwtPayload = req.jwtPayload;
    const userId = req.userId;
    if (!userId && !(jwtPayload && jwtPayload.admin)) return res.status(401).json({ message: 'unauthorized' });

    let userEmail = null;
    if (jwtPayload && jwtPayload.admin) userEmail = jwtPayload.email;
    else {
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
      userEmail = ures.rows[0] && ures.rows[0].email;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: 'admin not configured' });
    if (String(userEmail).toLowerCase() !== String(adminEmail).toLowerCase()) return res.status(403).json({ message: 'forbidden' });

    // delete the game
    await query('DELETE FROM games WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

module.exports = router;
