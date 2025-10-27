---
description: "Task list for 001-game-enhancements (backend, DB, tests, logging)"
---

# Tasks: 001-game-enhancements

**Input**: Design documents from `/specs/001-game-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

Purpose: Project initialization and basic structure. These tasks set up the
backend skeleton and developer experience. Many of these tasks are marked [P]
and can run in parallel.

- [x] T001 Initialize backend project and package.json (path: `backend/package.json`)
- [x] T002 [P] Add `.env.example` and docs to `backend/README.md` (existing)
- [ ] T003 [P] Add linting/formatting config (eslint, prettier) in repo root or `backend/` (paths: `.eslintrc`, `.prettierrc`)
- [ ] T004 [P] Add basic Dockerfile for local reproducible environment (optional)

## Phase 2: Foundational (Blocking Prerequisites)

Purpose: Core infra that MUST be complete before user stories start. These
implement constitution gates: tests, migrations, logging, and API contracts.

**⚠️ CRITICAL**: No user story work should merge until these complete.

- [x] T005 Setup MongoDB connection helper (done: `backend/src/db.js`) — ensure environment variable `MONGODB_URI` is read and error on missing secret.
- [ ] T006 [P] Add migrations tooling and initial config (e.g., `migrate-mongo` or custom scripts) and `migrations/` folder at repo root or `backend/migrations/`.
- [x] T007 Add structured logging infra (pino) and middleware for request logging in `backend/src/index.js` (done)
- [x] T008 Implement basic healthcheck and readiness endpoints (`/health`) — present in `backend/src/index.js` (done)
- [ ] T009 [P] Commit OpenAPI contract and contract-test harness: `specs/001-game-enhancements/contracts/openapi.yaml` and `backend/tests/contract/contract.test.js` (supertest-based)
- [ ] T010 [P] Create test runner config (Jest) in `backend/package.json` and `backend/jest.config.js`.
- [ ] T011 Security: Add secrets handling guidance and ensure `.env.local` is gitignored (update `.gitignore`).

## Phase 3: User Story Implementation (P1 → Pn)

Purpose: Implement user stories independently and test-first. Each story
includes contract tests (fail first) and unit tests for core logic.

---
User Story: US1 — Core Game Persistence & API (Priority: P1)
---
- [ ] T100 Write contract tests for POST /api/games, GET /api/games, GET /api/games/:id (files: `backend/tests/contract/test_games.contract.js`)
- [x] T101 [P] Implement Game model (done: `backend/src/models/game.model.js`) — add validation per `data-model.md`.
- [x] T102 Implement POST /api/games endpoint (done: `backend/src/routes/games.js`) and ensure it fails contract tests until implementation complete.
- [x] T103 Implement GET /api/games and GET /api/games/:id (done) and ensure contract tests pass.
- [ ] T104 Unit tests for model logic (validation, ordering of moves) `backend/tests/unit/test_game.model.js`.
- [ ] T105 Add migration script for initial Game schema (path: `backend/migrations/0001-initial-games.js`).

---
User Story: US2 — Move History & Statistics (Priority: P2)
---
- [x] T200 Contract test for statistics endpoint (e.g., GET /api/games/stats) `backend/tests/contract/test_stats.contract.js`.
- [x] T201 Implement statistics aggregation endpoint (path: `backend/src/routes/stats.js`) and unit tests for aggregation logic.
- [ ] T202 Add integration tests that create games and validate aggregate stats.


---
User Story: US3 — Commentary & Enhanced Analysis (Priority: P3)
---
- [ ] T300 Unit tests for commentary serialization and optional analysis metadata.
- [ ] T301 Extend Game model to support per-move analysis metadata (if not already present) and tests.
- [ ] T302 Contract tests to ensure commentary fields are stored/retrieved correctly.

---
Optional / Could Have (US4)
---
- [ ] T400 Tasks for replay, sharing, and tournament mode (deferred until core features complete)

## Phase 4: Cross-Cutting Concerns & Polish

- [ ] T500 Add API authentication (JWT):
  - T501 Implement user model (if required) `backend/src/models/user.model.js`.
  - T502 Implement auth routes (`/api/auth/login`) and token issuance.
  - T503 Add auth middleware `backend/src/middleware/auth.js` and protect write endpoints.
  - T504 Contract tests for protected endpoints.
- [ ] T510 Add request tracing/correlation id header middleware and ensure logs include correlation id.
- [ ] T520 Add CI workflow (GitHub Actions) to run unit + contract tests and run migrations in a dry run.
- [ ] T530 Add release notes + versioning procedure per constitution.

## Phase 5: Ops & Monitoring

- [ ] T600 Wire logs to chosen log collector (optional) and add basic metrics export (Prometheus or hosted metrics depending on infra).
- [ ] T610 Add alerting runbook for health failures and migration failures.

## Tasks notes & conventions

- Task IDs are stable references for PRs. Use `T###` in PR titles for traceability.
- Tests MUST be written first for all non-trivial changes (contract tests for API surfaces, unit tests for logic).
- Include exact file paths in PR descriptions to speed review.
- For any changes to data model, include a migration script and the data-backfill plan.
