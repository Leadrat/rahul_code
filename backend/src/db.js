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
}

module.exports = { pool, query, init };
