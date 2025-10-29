# Quickstart — Game enhancements backend

This document describes how to run the backend locally for development.

Prerequisites

- Node.js 18+ installed
- npm
- A MongoDB connection string (set `MONGODB_URI` in `.env.local`)

Steps

1. From the repository root, copy env example:

   ```powershell
   Copy-Item .env.example .env.local
   # Edit .env.local and set MONGODB_URI
   ```

2. Install dependencies and run server:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. Run contract tests (once added):

   ```powershell
   cd backend
   npm test
   ```

Health check

- GET http://localhost:4001/health

Notes

- Do not commit `.env.local`.
- CI should run tests and apply migrations before deployment.
