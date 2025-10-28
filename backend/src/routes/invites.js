const express = require('express');
const { query } = require('../db');

const router = express.Router();

// POST /api/invites - create an invite (to_email required)
router.post('/', async (req, res) => {
  const fromUserId = req.userId;
  if (!fromUserId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const { toEmail, gameId, message, expiresAt } = req.body || {};
    if (!toEmail) return res.status(400).json({ message: 'toEmail required' });
    const sql = `INSERT INTO invites(from_user_id, to_email, game_id, message, expires_at) VALUES($1, $2, $3, $4, $5) RETURNING id, from_user_id, to_email, game_id, status, message, expires_at, created_at`;
    const params = [fromUserId, toEmail, gameId || null, message || null, expiresAt || null];
    const result = await query(sql, params);
    const invite = result.rows[0];

    // notify via app notifier (socket) if available
    const notifier = req.app && req.app.get && req.app.get('notifier');
    if (notifier && typeof notifier.sendInvite === 'function') {
      try {
        await notifier.sendInvite(invite);
      } catch (err) {
        // ignore notifier errors, email fallback may still work
        console.warn('notifier.sendInvite failed', err && err.message);
      }
    }

    // enrich invite with sender email and online flags (presence map)
    try {
      const pres = req.app && req.app.get && req.app.get('presence');
      const senderRes = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [invite.from_user_id]);
      const from_user_email = senderRes.rows[0] && senderRes.rows[0].email;
      const fromKey = from_user_email && String(from_user_email).toLowerCase();
      const toKey = invite.to_email && String(invite.to_email).toLowerCase();
      const senderOnline = !!(pres && fromKey && pres[fromKey]);
      const receiverOnline = !!(pres && toKey && pres[toKey]);
      const out = Object.assign({}, invite, { from_user_email, senderOnline, receiverOnline });
      return res.status(201).json({ invite: out });
    } catch (e) {
      return res.status(201).json({ invite });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/invites - list invites to or from current user (by email)
router.get('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    // fetch invites addressed to the current user's email (receiver only)
    const userSql = 'SELECT email FROM users WHERE id=$1 LIMIT 1';
    const u = await query(userSql, [userId]);
    const email = u.rows[0] && u.rows[0].email;
    // include sender email for convenience and attach online flags
    const sql = `SELECT i.id, i.from_user_id, u.email as from_user_email, i.to_email, i.game_id, i.status, i.message, i.expires_at, i.created_at FROM invites i LEFT JOIN users u ON u.id = i.from_user_id WHERE i.to_email=$1 ORDER BY i.created_at DESC`;
    const result = await query(sql, [email]);
    const pres = req.app && req.app.get && req.app.get('presence');
    const invites = result.rows.map(row => {
      const fromKey = row.from_user_email && String(row.from_user_email).toLowerCase();
      const toKey = row.to_email && String(row.to_email).toLowerCase();
      return Object.assign({}, row, { senderOnline: !!(pres && fromKey && pres[fromKey]), receiverOnline: !!(pres && toKey && pres[toKey]) });
    });
    return res.json({ invites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// POST /api/invites/:id/start - sender starts a game after invite accepted
router.post('/:id/start', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const inviteId = req.params.id;
    const invRes = await query('SELECT id, from_user_id, to_email, status FROM invites WHERE id=$1 LIMIT 1', [inviteId]);
    const inv = invRes.rows[0];
    if (!inv) return res.status(404).json({ message: 'invite not found' });
    if (inv.from_user_id !== userId) return res.status(403).json({ message: 'not sender' });
    if (inv.status !== 'accepted') return res.status(400).json({ message: 'invite not accepted' });

    // get sender email
    const sres = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [userId]);
    const senderEmail = sres.rows[0] && sres.rows[0].email;

    // create a minimal game record with both players
    const players = [senderEmail, inv.to_email];
    const sql = `INSERT INTO games(user_id, name, players, human_player, moves, winner) VALUES($1, $2, $3, $4, $5::jsonb, $6) RETURNING id`;
    const params = [userId, null, players, null, JSON.stringify([]), null];
    const gres = await query(sql, params);
    const game = gres.rows[0];

    // notify both players via notifier
    const notifier = req.app && req.app.get && req.app.get('notifier');
    if (notifier && typeof notifier.startGame === 'function') {
      try {
        await notifier.startGame({ gameId: game.id, players });
      } catch (err) {
        console.warn('notifier.startGame failed', err && err.message);
      }
    }

    return res.json({ gameId: game.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// POST /api/invites/:id/respond - accept or decline
router.post('/:id/respond', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const { response } = req.body || {};
    if (!['accept', 'decline'].includes(response)) return res.status(400).json({ message: 'invalid response' });
    const inviteId = req.params.id;
    // ensure user is the recipient (by email)
    const userSql = 'SELECT email FROM users WHERE id=$1 LIMIT 1';
    const u = await query(userSql, [userId]);
    const email = u.rows[0] && u.rows[0].email;
    const invSql = 'SELECT id, from_user_id, to_email, game_id, status FROM invites WHERE id=$1 LIMIT 1';
    const invRes = await query(invSql, [inviteId]);
    const invite = invRes.rows[0];
    if (!invite) return res.status(404).json({ message: 'invite not found' });
    if (invite.to_email !== email) return res.status(403).json({ message: 'not recipient' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'invite not pending' });

    const newStatus = response === 'accept' ? 'accepted' : 'declined';
    await query('UPDATE invites SET status=$1 WHERE id=$2', [newStatus, inviteId]);

    // notify sender if online
    const notifier = req.app && req.app.get && req.app.get('notifier');
    if (notifier && typeof notifier.notifyInviteStatus === 'function') {
      try {
        await notifier.notifyInviteStatus({ inviteId, status: newStatus, toEmail: invite.to_email });
      } catch (err) {
        console.warn('notifier.notifyInviteStatus failed', err && err.message);
      }
    }

    // if accepted, create a minimal game immediately and notify both players
    if (newStatus === 'accepted') {
      try {
        // get sender email
        const sres = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [invite.from_user_id]);
        const senderEmail = sres.rows[0] && sres.rows[0].email;
        const players = [senderEmail, invite.to_email];
        const sql = `INSERT INTO games(user_id, name, players, human_player, moves, winner) VALUES($1, $2, $3, $4, $5::jsonb, $6) RETURNING id`;
        const params = [invite.from_user_id, null, players, null, JSON.stringify([]), null];
        const gres = await query(sql, params);
        const game = gres.rows[0];

        if (notifier && typeof notifier.startGame === 'function') {
          try {
            await notifier.startGame({ gameId: game.id, players });
          } catch (err) {
            console.warn('notifier.startGame failed', err && err.message);
          }
        }

        return res.json({ id: inviteId, status: newStatus, gameId: game.id });
      } catch (err) {
        console.warn('failed to create game on accept', err && err.message);
        return res.json({ id: inviteId, status: newStatus });
      }
    }

    return res.json({ id: inviteId, status: newStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// DELETE /api/invites/:id - cancel an invite (sender)
router.delete('/:id', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'unauthorized' });
  try {
    const inviteId = req.params.id;
    const invSql = 'SELECT id, from_user_id, status FROM invites WHERE id=$1 LIMIT 1';
    const invRes = await query(invSql, [inviteId]);
    const invite = invRes.rows[0];
    if (!invite) return res.status(404).json({ message: 'invite not found' });
    if (invite.from_user_id !== userId) return res.status(403).json({ message: 'not sender' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'cannot cancel' });
    await query('UPDATE invites SET status=$1 WHERE id=$2', ['cancelled', inviteId]);
    return res.json({ id: inviteId, status: 'cancelled' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

module.exports = router;
