# API Requirements Quality Checklist

Purpose: Unit-tests-for-English checklist to validate that the API requirements in `specs/001-game-enhancements/spec.md` are complete, clear, consistent and measurable.

Created: 2025-10-24
Source spec: `specs/001-game-enhancements/spec.md`

## Requirement Completeness
- [ ] CHK001 - Are all API endpoints referenced in the user stories present in the spec and contract (POST /api/games, GET /api/games, GET /api/games/{id}, and statistics endpoints)? [Completeness, Spec §US1/US2]
- [ ] CHK002 - Is the `/api/games/stats` endpoint explicitly included in `contracts/openapi.yaml` and listed with expected request parameters and response shape? [Gap, Spec §US2]
- [ ] CHK003 - Are error handling requirements defined for all API failure modes (validation errors, DB errors, auth errors, rate limiting)? [Completeness, Spec §FR-API-001]
- [ ] CHK004 - Are authentication and authorization requirements specified for each endpoint (which are public vs protected)? [Completeness, Spec §FR-SEC-001]

## Requirement Clarity
- [ ] CHK005 - Is the exact request/response shape for POST /api/games (including move representation, timestamps, commentary metadata) specified or referenced to a contract section? [Clarity, Spec §US1]
- [ ] CHK006 - Is the format and schema of a "move" (fields, types, optional analysis metadata) explicitly defined so model validation rules are unambiguous? [Clarity, Spec §US3, Data model]
- [ ] CHK007 - Are non-functional terms quantified where used (e.g., "fast", "structured logs", "p95 latency < 200ms")? [Clarity, Spec §NFR]
- [ ] CHK008 - Is the error response format (HTTP status codes and JSON body fields) defined for success and each class of failure? [Clarity, Spec §FR-API-001]

## Requirement Consistency
- [ ] CHK009 - Are authentication requirements consistent across spec text, plan, and tasks (i.e., FR-SEC-001 aligns with T500 and plan statements)? [Consistency, Spec §FR-SEC-001]
- [ ] CHK010 - Do the contract endpoints listed in `contracts/openapi.yaml` match the tasks that reference contract tests (T009, T100, T200)? [Consistency, Spec §Tasks]
- [ ] CHK011 - Are field names and types consistent between spec examples, data-model.md and the OpenAPI contract (e.g., `moves`, `commentary`, `analysis`) ? [Consistency, Data model & contracts]

## Acceptance Criteria Quality (Measurability)
- [ ] CHK012 - Are acceptance criteria measurable and expressed in verifiable terms (e.g., show example payloads, exact fields to persist, and sample expected aggregated stats)? [Measurability, Spec §US1/US2]
- [ ] CHK013 - Are success criteria for statistics endpoints defined with concrete aggregation definitions (e.g., "wins per player per N games", aggregation timeframe)? [Measurability, Spec §US2]
- [ ] CHK014 - Do contract tests have clear pass/fail criteria tied to spec sections (e.g., which response fields are required vs optional)? [Measurability, Tasks T009/T100]

## Scenario Coverage
- [ ] CHK015 - Are primary, alternate, exception, recovery scenario classes covered in the spec for the API (create success, invalid move, concurrent conflicting moves, DB transient errors, auth failure)? [Coverage, Spec §US1, Data model]
- [ ] CHK016 - Is the expected behavior for concurrent move attempts or conflicting state updates documented (what is authoritative source of truth and how to resolve conflicts)? [Coverage, Gap, Spec §US1]
- [ ] CHK017 - Are retry/backoff, timeout and idempotency behaviors defined for the create endpoint (POST /api/games) when the same logical request is sent multiple times? [Coverage, Gap]

## Edge Case Coverage
- [ ] CHK018 - Are edge cases defined for invalid or out-of-order moves, malformed commentary, very large move histories, or missing optional analysis metadata? [Edge Case, Data model]
- [ ] CHK019 - Is the behavior defined for partial failures during multi-step operations (e.g., recording move + writing commentary + updating stats) and is a rollback plan specified? [Edge Case, Gap]

## Non-Functional Requirements (NFRs)
- [ ] CHK020 - Are logging requirements concrete: what must be logged at minimum (request id, user id if any, endpoint, latency, error details) and log format named (pino/JSON)? [NFR, Spec §FR-LOG-001]
- [ ] CHK021 - Are observability/monitoring targets defined (metrics to collect; which endpoints must export latency/error rates)? [NFR, Plan §Observability]
- [ ] CHK022 - Is the expected performance envelope for critical user journeys documented (e.g., p95 targets for read/write under targeted load)? [NFR, Plan §Performance Goals]

## Dependencies & Assumptions
- [ ] CHK023 - Are external dependencies and assumptions documented and validated (e.g., MongoDB Atlas availability, expected schema migrations policy)? [Assumption, Plan §Migrations]
- [ ] CHK024 - Is the user identity model and token lifecycle (access token expiry, refresh policy) documented and mapped to which endpoints require authentication? [Assumption, Spec §FR-SEC-001]

## Ambiguities & Conflicts
- [ ] CHK025 - Are any ambiguous terms in the spec ("structured logs", "analysis metadata", "fast") flagged and linked to concrete definitions or examples? [Ambiguity, Spec §Glossary or Notes]
- [ ] CHK026 - If an endpoint is referenced in tasks but absent from `contracts/openapi.yaml`, is there a documented reason (out-of-scope or TBD)? [Conflict, Tasks vs Contracts]

---

Traceability: where possible items reference spec sections or tasks. If you want a different focus (security-first, performance-first), run `/speckit.checklist` again and choose `security.md` or `performance.md`.

(Each `/speckit.checklist` invocation creates a new file — this is a new file: `api.md`.)
