# Research: Game enhancements (Phase 0)

Date: 2025-10-24

This research document resolves technology and process unknowns required to
produce a Phase 1 design for backend + DB + tests + logging for the tic-tac-toe
project.

Decision 1: Runtime and framework
- Decision: Use Node.js 18.x (LTS) with Express.
- Rationale: The existing frontend is Next.js (JavaScript/TypeScript). A Node
  backend minimizes context switching, has wide library support (Mongoose,
  pino), and is easy to run locally and in Docker.
- Alternatives considered: Fastify (faster), Koa (minimal). Rejected because
  Express has the largest ecosystem and smallest friction for this small team.

Decision 2: Database & migrations
- Decision: Use MongoDB Atlas for production (already provided) and
  `migrate-mongo` for migration scripts.
- Rationale: The data is document-oriented (move lists per game). `migrate-
  mongo` is a lightweight migrations tool that integrates with MongoDB.
- Alternatives: Use a relational DB + Prisma or Postgres; rejected because
  it would require schema translation and the provided Atlas cluster is
  immediately available.

Decision 3: Testing stack
- Decision: Jest for unit tests; Supertest for HTTP/contract tests.
- Rationale: Jest is widely used, fast, and integrates well with Node projects.
  Supertest pairs with Jest for endpoint tests and enables contract validation.

Decision 4: Observability
- Decision: Use structured JSON logging with `pino` and ensure request-level
  logs contain correlation/request ids; expose a `/health` endpoint and
  instrument basic request timing metrics (respond-time or middleware).
- Rationale: Structured logs are required by the constitution; `pino` is
  performant and simple to integrate.

Decision 5: Authentication
- Decision: JWT bearer tokens for protected endpoints.
- Rationale: Suitable for APIs and mobile/web clients, scales without server
  session store, and aligns with future multiplayer/user features.

Decision 6: Migrations & data-backfill strategy
- Decision: Create a `migrations/` folder and use `migrate-mongo` scripts.
- Rationale: Keeps migrations explicit and versioned; scripts can be run in
  CI before deployments.

Open questions / deferred items (to address in Phase 1)
- Exact performance targets (users, throughput) — will define in Phase 1.
- Token expiry, refresh token flow, and user model fields (email, display
  name) — implement in Phase 1 when user requirements are finalized.
