const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const authMiddleware = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const pwHash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email, created_at';
    const result = await query(sql, [email, pwHash]);
    const user = result.rows[0];
    return res.status(201).json({ user });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ message: 'email already registered' });
    }
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const sql = 'SELECT id, email, password_hash FROM users WHERE email=$1 LIMIT 1';
    const result = await query(sql, [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// GET /api/auth/me - return current user info and whether they're admin
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'unauthorized' });
    const sql = 'SELECT id, email, created_at FROM users WHERE id=$1 LIMIT 1';
    const result = await query(sql, [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'not found' });
    const isAdmin = !!(process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL);
    return res.json({ id: user.id, email: user.email, isAdmin });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'internal error' });
  }
});

module.exports = router;
