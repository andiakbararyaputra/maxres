# Code Patterns

## Purpose
This file defines the implementation patterns the agent should follow for this project.
Prefer these patterns over inventing new ones.

## Architecture Pattern
- **Primary pattern:** simple layered — UI components (`src/components/`) render state; orchestration logic (`src/lib/`) talks to Tauri APIs and the sidecar.
- **Rule:** Components never spawn processes or touch the filesystem directly — they call functions from `src/lib/`.
- **Rule:** Reuse existing modules before creating new abstractions. This app is ONE screen; resist splitting into many layers.

## Data Fetching
- **Primary approach:** NONE. There is no server and no network permission. The only "data" operations are Tauri plugin calls (fs, dialog, store, shell-sidecar).
- **Rule:** Never add `fetch()`/HTTP clients. If a task seems to need the network, stop and ask the human — it probably violates the offline promise.

## State Management
- **Client state:** React `useReducer` implementing the explicit state machine `idle → fileReady → processing → done | error`. No state library — built-in React is sufficient for one screen.
- **Persistent state:** images-upscaled counter only, via `@tauri-apps/plugin-store` (local JSON file).
- **Forms:** none in MVP.
- **Rule:** Prefer the simplest working approach for MVP scope.

## Error Handling
- Normalize errors at the `src/lib/` boundary — sidecar/fs failures become typed results (`UpscaleResult` in `tech_stack.md`); never let raw exceptions reach components.
- Never swallow errors silently; always surface a friendly message and log details to console for debugging.
- Out-of-memory on 16x gets a specific message: "Not enough memory for this size. Try 4x instead."
- Return user-safe messages in the UI (Maria must understand them — no stack traces, no jargon).

## Validation
- Validate all external inputs at the boundary: dropped files (extension whitelist: jpg/jpeg/png/webp), file existence, and free disk space before processing.
- Pass file paths as sidecar arguments — NEVER interpolate into shell strings (injection safety).
- Trust internal types inside the boundary once validated.

## File and Naming Conventions
- **Files:** kebab-case (`factor-button.tsx`, `upscaler.ts`)
- **Components / classes:** PascalCase
- **Functions / variables:** camelCase
- **Constants / env vars:** UPPER_SNAKE_CASE
- **Output images:** `<original-name>_<factor>x.png` saved next to the original

## Testing Pattern
- Unit tests (Vitest) for pure logic: factor orchestration plan, filename suffixing, input validation.
- Manual test matrix in `testing.md` for UI and end-to-end flows (including the offline test).
- Run checks after every feature; fix failures before moving on.

## Change Discipline
- Prefer focused, minimal edits over large rewrites.
- Do not introduce new dependencies without checking `tech_stack.md` first — the dependency list is intentionally tiny.
- Do not change `src-tauri/capabilities/`, tauri.conf.json security sections, `src-tauri/binaries/`, or `.github/workflows/` without explicit approval.
- One feature at a time — commit after each working feature.
- Explain each change in plain English for the vibe-coder founder.
