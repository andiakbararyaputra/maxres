# Product Requirements

> Source of truth: `docs/PRD-MaxRes-MVP.md`. This is the agent-facing extract.

## Product
**MaxRes** — Make any photo print-ready: free, private, and stupidly simple.
**Launch goal:** open-source traction (GitHub stars + downloads). **Timeline:** ~1 week. **Budget:** $0.

## Primary User Story
"Meet Maria, 52, who scans an old family photo of her parents but it's tiny and blurry. She finds MaxRes, drags the photo in, taps 4x, and 30 seconds later has a crisp print-ready version — without uploading her family's photos to some website. She prints it for her mother's birthday."

## Must-Have Features (P0 — the ONLY things to build)

### 1. Multi-Factor AI Upscaling (2x / 4x / 8x / 16x)
- As a photo owner, I want to choose how much bigger my image gets so the result fits my need (screen vs print)
- Acceptance criteria:
  - [ ] All four factors produce a correct-size, visibly sharper output image
  - [ ] 16x is labeled "Experimental" with a memory warning (may fail on older machines)
  - [ ] Output auto-saved next to the original with a clear suffix (e.g., `photo_4x.png`)

### 2. Drag & Drop Simple UI
- As a non-technical user, I want to drop a photo and press one button so that I never feel lost
- Acceptance criteria:
  - [ ] A first-time user completes an upscale with zero instructions
  - [ ] Drag & drop AND tap-to-browse both work
  - [ ] Clear progress feedback while processing; clear success/failure message after

### 3. 100% Offline / Private Processing
- As a privacy-conscious user, I want my photos to never leave my device so I can trust the app with family pictures
- Acceptance criteria:
  - [ ] Full upscale works with network disabled
  - [ ] Zero outbound network requests (verifiable)
  - [ ] "Works offline — your photos never leave your device" stated in-app

## NOT in MVP (do not build these, even if tempting)
| Feature | When |
|---------|------|
| Before/after preview slider | v1.1 — first post-launch addition |
| Batch processing | after single-image flow is proven stable |
| Extra AI enhancements (denoise, face restore, colorize) | after ~100 stars |
| Multiple AI model choices | after v2 |
| Multi-language support | after v2 (English-only at launch) |

## Success Metrics
| Window | Metric | Target |
|--------|--------|--------|
| 30 days | GitHub stars | 100 |
| 30 days | Release downloads | 500 |
| 30 days | Images upscaled | local-only counter in app (no telemetry) |
| 2-3 months | GitHub stars | 500 |
| 2-3 months | Issues/discussions | 10+ |

## Look & Feel
**Vibe:** clean, dark, minimal. One screen, one job. Dark mode default. Big touch-friendly targets (48px+).
Screens: main (drop zone + factor buttons) → processing (progress) → done ("Show file" / "Upscale another").

## Quality Standards (will not accept)
- Placeholder content in production
- Broken features — everything listed works or isn't included
- A size factor that silently fails — warn or disable instead
- Claiming mobile support without mobile testing
- Ignoring accessibility basics (keyboard operable, AA contrast, labeled controls)

## Platform & Constraints
- Desktop first: Windows/macOS/Linux via Tauri v2. Android = fast-follow (sidecar limitation). iOS deferred ($99/yr fee vs $0 budget).
- Unsigned installers → OS warnings; landing page documents the bypass.
- Performance bar: typical photo at 4x in under ~60s on a 5-year-old machine.

## Definition of Done for MVP
- [ ] All 3 P0 features functional per acceptance criteria
- [ ] Basic error handling (bad file type, out-of-memory, cancelled job)
- [ ] Works on Windows + macOS (+ Android if timeline holds)
- [ ] End-to-end journey works: drop → pick factor → saved result
- [ ] Local-only usage counter works
- [ ] Friends/family test complete (5+ people, zero-instruction success)
- [ ] GitHub release with installers published + landing page linked
