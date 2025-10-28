const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const invitesRoutes = require('./routes/invites');
const adminRoutes = require('./routes/admin');
const authMiddleware = require('./middleware/auth');
const { init, query } = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ ok: true, version: '0.1.0' }));

app.use('/api/auth', authRoutes);
// games routes (protected)
app.use('/api/games', authMiddleware, gamesRoutes);
app.use('/api/invites', authMiddleware, invitesRoutes);
app.use('/api/admin', adminRoutes);

// presence map: email -> Set(socketId)
const presence = {};

// simple in-memory game rooms store (MVP) keyed by gameId
const games = {};

// create HTTP server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// configure nodemailer if env provided
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// helper: send email if mailer available
async function sendEmailInvite(to, subject, text, html) {
  if (!mailer) return; // not configured
  try {
    await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
  } catch (err) {
    console.warn('sendEmailInvite failed', err && err.message);
  }
}

// notifier used by routes
const notifier = {
  // send invite to email (emit via sockets if online + send email if configured)
  async sendInvite(invite) {
    const to = invite.to_email;
    // determine online/offline for sender and receiver
    const toKey = to && String(to).toLowerCase();
    const fromRes = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [invite.from_user_id]);
    const fromEmail = fromRes.rows[0] && fromRes.rows[0].email && String(fromRes.rows[0].email).toLowerCase();
    const senderOnline = fromEmail && !!(presence && presence[fromEmail]);
    const receiverOnline = toKey && !!(presence && presence[toKey]);

    const payload = Object.assign({}, invite, { from_user_email: fromEmail, senderOnline, receiverOnline });
    // emit to connected sockets for this email (receiver)
    const sockets = toKey && presence[toKey];
    if (sockets && sockets.size) {
      sockets.forEach(socketId => io.to(socketId).emit('invite:received', payload));
    }
    // send email as fallback/notification
    const subject = `Game invite from user ${invite.from_user_id}`;
    const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/?invite=${invite.id}`;
    const text = `You have been invited to play. Open ${link}`;
    const html = `<p>You have been invited to play. <a href="${link}">Open game</a></p>`;
    await sendEmailInvite(to, subject, text, html);
  },
  async notifyInviteStatus({ inviteId, status, toEmail }) {
    // find sender id and notify by email/socket
    try {
      const res = await query('SELECT from_user_id, to_email FROM invites WHERE id=$1 LIMIT 1', [inviteId]);
      const inv = res.rows[0];
      if (!inv) return;
      const senderId = inv.from_user_id;
      // get sender email
      const ures = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [senderId]);
      const senderEmail = ures.rows[0] && ures.rows[0].email && String(ures.rows[0].email).toLowerCase();
      const receiverKey = inv.to_email && String(inv.to_email).toLowerCase();
      const senderOnline = senderEmail && !!(presence && presence[senderEmail]);
      const receiverOnline = receiverKey && !!(presence && presence[receiverKey]);
      if (senderEmail && presence[senderEmail]) {
        presence[senderEmail].forEach(sid => io.to(sid).emit('invite:status', { inviteId, status, senderOnline, receiverOnline, toEmail: receiverKey }));
      }
      // optionally email the sender
      if (senderEmail) {
        await sendEmailInvite(senderEmail, `Your invite was ${status}`, `Invite ${inviteId} was ${status}`, `<p>Invite ${inviteId} was ${status}</p>`);
      }
    } catch (err) {
      console.warn('notifyInviteStatus failed', err && err.message);
    }
  },
  // notify both players that a game was started (from an accepted invite)
  async startGame({ gameId, players }) {
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const payload = { gameId, players, url: `${clientUrl}/game/${gameId}` };
      if (!Array.isArray(players)) players = [];
      // for each player email, emit to connected sockets if any, otherwise send email
      for (let p of players) {
        if (!p) continue;
        const key = String(p).toLowerCase();
        const sockets = presence && presence[key];
        if (sockets && sockets.size) {
          sockets.forEach(sid => io.to(sid).emit('game:started', payload));
        } else {
          // send email fallback
          const subject = `Game started (${gameId})`;
          const text = `A game has been started. Open ${payload.url}`;
          const html = `<p>A game has been started. <a href="${payload.url}">Open game</a></p>`;
          await sendEmailInvite(p, subject, text, html);
        }
      }
    } catch (err) {
      console.warn('startGame notifier failed', err && err.message);
    }
  }
};

// expose presence and notifier to express routes
app.set('presence', presence);
app.set('notifier', notifier);

// socket authentication and handlers
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(); // allow anonymous sockets (optional)
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.sub;
    // fetch user email
    const r = await query('SELECT email FROM users WHERE id=$1 LIMIT 1', [socket.userId]);
    socket.email = r.rows[0] && r.rows[0].email && String(r.rows[0].email).toLowerCase();
    return next();
  } catch (err) {
    // proceed without user info if token invalid
    return next();
  }
});

io.on('connection', socket => {
  // track presence by email
  if (socket.email) {
    const e = String(socket.email).toLowerCase();
    presence[e] = presence[e] || new Set();
    presence[e].add(socket.id);
    // notify other sockets of presence change
    io.emit('presence:changed', { email: e, online: true });
  }

  socket.on('game:join', ({ gameId }) => {
    if (!gameId) return;
    socket.join(`game:${gameId}`);
    // send current state if exists
    if (games[gameId]) {
      socket.emit('game:state', games[gameId]);
    }
  });

  socket.on('move', async (payload) => {
    // payload: { gameId, move, playerEmail }
    const { gameId, move, playerEmail } = payload || {};
    if (!gameId || !move) return;
    // naive in-memory apply: append move
    games[gameId] = games[gameId] || { id: gameId, moves: [], status: 'active', players: [] };
    games[gameId].moves.push({ move, playerEmail, at: new Date().toISOString() });
    // emit to room
    io.to(`game:${gameId}`).emit('move:applied', { gameId, move, playerEmail, state: games[gameId] });
  });

  socket.on('disconnect', () => {
    if (socket.email) {
      const e = String(socket.email).toLowerCase();
      if (presence[e]) {
        presence[e].delete(socket.id);
        if (presence[e].size === 0) {
          delete presence[e];
          io.emit('presence:changed', { email: e, online: false });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4001;

async function start() {
  try {
    await init();
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, server, io };
