# Backend server for rahul_code (Tic-Tac-Toe enhancements)

This is a minimal Express backend that provides endpoints to persist and
retrieve games. It uses MongoDB (configured via environment variable). The
implementation follows the project constitution: tests (required), migrations,
and structured logging are expected.

Quick start (local development)

1. Copy environment example and set the connection string (DO NOT commit secrets):

   - On Windows (PowerShell):

     Copy-Item .env.example .env.local
     # then edit .env.local and set MONGODB_URI

2. Install dependencies (run in `backend/`):

   npm install

3. Start the server:

   npm run dev

Endpoints

- GET /health → { status: 'ok' }
- GET /api/games → list recent games
- POST /api/games → create a new game (body: players[], moves[])
- GET /api/games/:id → get a single game

Notes and next steps

- Do not store credentials in source. Use environment variables or secret
  manager (e.g., GitHub Actions secrets) for CI.
- Add tests: contract tests for the API and unit tests for model logic.
- Add migrations: if schema changes are introduced consider a simple
  migrations folder with scripts using mongoose to transform data.
