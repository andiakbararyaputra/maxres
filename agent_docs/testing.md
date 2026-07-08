# Testing Strategy

## Frameworks

- **Unit Tests:** Vitest (comes naturally with Vite) — for pure logic only: factor orchestration (which passes/downscales run per factor), output filename suffixing, input validation
- **E2E Tests:** Manual test matrix (below). Automated E2E for Tauri (WebDriver) is overkill for a 1-week MVP — revisit post-launch.

## Rules & Requirements

- **Coverage:** Pure logic in `src/lib/` must have unit tests. UI is verified manually against the matrix.
- **Before Commit:** run `npm test` and `npm run lint`; both must pass.
- **Failures:** NEVER skip tests or mock out assertions to make a pipeline pass without Human approval. If an Agent breaks a test, the Agent must fix it.

## Manual Test Matrix (the real quality gate — from Tech Design)

Run after each feature; ALL must pass before a phase is "done":

| #   | Test                                            | Expected                                                                      |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Small JPG at 2x, 4x, 8x                         | Correct output size, visibly sharper, saved as `name_Nx.png` next to original |
| 2   | Large PNG at 4x                                 | Completes with progress feedback (no frozen UI)                               |
| 3   | Transparent PNG                                 | Transparency preserved                                                        |
| 4   | Filename with spaces & unicode                  | Works (paths passed as args, never shell strings)                             |
| 5   | Non-image file dropped (.pdf/.txt)              | Friendly error, app stays usable                                              |
| 6   | 16x on a big image                              | Pre-flight warning shown; on failure, graceful "try 4x" message               |
| 7   | Cancel mid-processing                           | Job stops, app returns to idle, no orphan temp files                          |
| 8   | **Offline test:** Wi-Fi disabled → full upscale | Succeeds (core promise)                                                       |
| 9   | Zero-instruction test                           | A first-time user completes an upscale unaided                                |

## Pre-commit Hooks

- Once ESLint/Prettier are configured: add a simple git pre-commit hook running `npm run lint && npm test`
- Do not bypass hooks (`--no-verify` requires human approval)

## Verification Loop

1. Implement one feature → 2. `npm test` + `npm run lint` → 3. Run relevant manual matrix rows → 4. Fix failures → 5. Update `MEMORY.md` → 6. Commit

## Execution

- All unit tests: `npm test`
- Single file: `npx vitest run src/lib/upscaler.test.ts`
