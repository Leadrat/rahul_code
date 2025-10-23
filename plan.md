# Next.js 14 Tic-Tac-Toe (TypeScript, CSS Modules)

## Scope

- Basic local 2‑player game (no AI, no score persistence)
- Next.js 14+ App Router with TypeScript
- Styling via CSS Modules only

## Setup (you will run these commands)

- Create app: `npx create-next-app@latest tic-tac-toe --ts --eslint --app --src-dir --no-tailwind --use-npm`
- `cd tic-tac-toe`
- Start dev: `npm run dev`

## Files to Add/Edit

- `app/layout.tsx`: Basic document shell with font and global container.
- `app/page.tsx`: Game page with state, board rendering, status, and reset.
- `components/Board.tsx`: Presentational 3×3 grid accepting props and raising click events.
- `components/Square.tsx`: Single cell button.
- `components/types.ts`: Shared types (`Player`, `SquareValue`).
- `components/Board.module.css`, `components/Square.module.css`: Styles for grid/cells.
- Optionally keep `app/globals.css` minimal (no Tailwind).

## Key Logic (concise)

- Board state: `SquareValue[]` of length 9 where `SquareValue = Player | null` and `Player = 'X' | 'O'`.
- Turn: `currentPlayer` toggles `'X'`/`'O'` after valid move.
- Win detection: check 8 lines; if found, set `winner`. If no nulls and no winner → draw.
```
// Winning lines
const lines = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diags
];
```


## Component Contracts (essential)

- `Square`
  - props: `{ value: SquareValue; onClick: () => void; disabled?: boolean }`
- `Board`
  - props: `{ squares: SquareValue[]; onSquareClick: (index: number) => void; isLocked: boolean }`

## Minimal UI Behavior

- Grid rendered by `Board` using 9 `Square`s (index 0..8).
- Clicking a square marks current player's symbol if empty and game not finished.
- Status text above grid shows: "Next: X/O", "Winner: X/O", or "Draw".
- "Reset" button clears board and state.

## Build/Run

- `npm run dev` → open `http://localhost:3000`

## Notes

- No external packages needed beyond Next.js defaults.
- Keep CSS Modules simple: centered layout, responsive grid, large square buttons.