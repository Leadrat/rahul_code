# Data Model: Game enhancements

Entities

1) Game
- id: string (ObjectId) — primary key
- players: array[string] — player identifiers (e.g., 'X','O' or user ids)
- moves: array[Move] — ordered list of moves
- result: enum('X','O','draw','in-progress')
- commentary: optional string — high-level game commentary
- createdAt: datetime
- updatedAt: datetime

Indexes & uniqueness
- _id (ObjectId) primary index
- createdAt index for most-recent queries

2) Move (embedded document)
- player: string
- index: integer (0-8 for 3x3 board)
- commentary: optional string
- createdAt: datetime

Validation & constraints
- Move.index MUST be an integer between 0 and 8 for a 3x3 board.
- Moves MUST be stored in order they were played.

State transitions
- result defaults to 'in-progress'
- when a winning condition is detected, result transitions to 'X' or 'O'
- on draw, transitions to 'draw'

Retention & backfill
- No automatic purge required for MVP; retention policy TBD (Phase 2).
