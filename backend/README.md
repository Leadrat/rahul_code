# Backend (Auth)

This is a small Express backend that connects to a Postgres-compatible database (Neon) and provides registration and login endpoints.

Environment
- Create a `.env` file in `backend/` with the values from `.env.example`.

Scripts
- Install dependencies: `npm install` (run in `backend/`)
- Start in dev: `npm run dev`
- Start: `npm start`

API
- POST /api/auth/register  { email, password }
- POST /api/auth/login     { email, password }

Security
- This server returns a JWT on successful login. In production, set a strong `JWT_SECRET` in your environment.

Note: The code will auto-create a `users` table on startup if it doesn't exist.
