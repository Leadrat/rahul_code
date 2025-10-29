const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/tic_tac_toe?sslmode=require&channel_binding=require";

const pool = new Pool({ connectionString });

async function query(text, params) {
  return pool.query(text, params);
}

async function init() {
  // Create users table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Create games table to store user game history
  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      players TEXT[],
      human_player TEXT,
      moves JSONB,
      winner TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Create invites table to support multiplayer invites (by email)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invites (
      id SERIAL PRIMARY KEY,
      from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_email TEXT NOT NULL,
      game_id INTEGER,
      status TEXT DEFAULT 'pending',
      message TEXT,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // In case the table existed before we added human_player, ensure the column exists
  try {
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS human_player TEXT;`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Could not ensure human_player column exists:', err.message || err);
  }
}

module.exports = { pool, query, init };
