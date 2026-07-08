# Project Brief (Persistent)

- **Product vision:** MaxRes makes any photo print-ready — free, 100% offline, and stupidly simple (drop → pick size → done).
- **Target Audience:** Casual, non-technical users restoring old/blurry photos (persona: Maria, 52). They get zero instructions and must succeed anyway.

## Conventions

- **Naming:** kebab-case files, PascalCase components, camelCase functions (details in `tech_stack.md`)
- **File Structure:** UI in `src/components/`, orchestration logic in `src/lib/`, tokens in `src/styles/tokens.css`; colocate tests (`upscaler.test.ts` next to `upscaler.ts`)
- **UI state:** single explicit state machine `idle → fileReady → processing → done | error`

## Quality Gates

- `REVIEW-CHECKLIST.md` passes before any feature is called done
- Manual test matrix in `testing.md` (incl. the offline test — Wi-Fi off, upscale must succeed)
- Lint + typecheck clean; Vitest unit tests for pure logic
- Git commit after every working step

## Key Commands

- Dev: `npm run tauri dev` · Test: `npm test` · Lint: `npm run lint` · Build: `npm run tauri build`

## Key Principles

- Ship the simplest possible solution that solves the user story.
- "Works perfectly" beats fast and beats pretty — reliability on other people's machines is the bar.
- The offline/privacy promise is non-negotiable: no network calls, no telemetry, minimal Tauri permissions.
- Scope is locked to the 3 P0 features (see `product_requirements.md`); everything else is v1.1+.
- Explain what was built in plain English after each change (vibe-coder founder).

## Update Cadence

- Update `MEMORY.md` after every milestone/decision; refresh this brief when conventions or commands change (e.g., when lint/test scripts are added).
