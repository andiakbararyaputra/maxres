# System Memory & Context 🧠

<!--
AGENTS: Update this file after every major milestone, structural change, or resolved bug.
DO NOT delete historical context if it is still relevant. Compress older completed items.
-->

## 🏗️ Active Phase & Goal

**Current Task:** Phase 1 COMPLETE ✅ — next up is Phase 2 (Sidecar): bundle the `realesrgan-ncnn-vulkan` AI engine and execute it from the frontend
**Next Steps (Phase 2):**

1. Download `realesrgan-ncnn-vulkan` from Real-ESRGAN GitHub Releases (executable + `models/` folder)
2. Create `src-tauri/binaries/`; rename executable to the platform target triple (e.g. `upscaler-x86_64-unknown-linux-gnu`)
3. Add `@tauri-apps/plugin-shell` (JS) + `tauri-plugin-shell` (Rust); declare `externalBin` in tauri.conf.json; add shell/fs permissions to capabilities (REQUIRES human approval — protected area)
4. Prove the sidecar runs from a button click on a test image

## 📂 Architectural Decisions

_(Log specific choices made during the build here so future agents respect them)_

- 2026-07-08 — Chose Tauri v2 over Electron/Flutter/web: tiny bundles, sidecar support, $0, and a future mobile path in one codebase (see docs/TechDesign-MaxRes-MVP.md).
- 2026-07-08 — AI engine is `realesrgan-ncnn-vulkan` as a bundled sidecar; app orchestrates factors (4x native; 2x = 4x→50% downscale; 8x = 4x→4x→50% downscale; 16x = two chained passes, Experimental).
- 2026-07-08 — Desktop-first: ship Windows/macOS/Linux on time; Android is a fast-follow (Tauri mobile does NOT support desktop-style sidecars — needs separate engine integration). iOS blocked by $0 budget (Apple fee).
- 2026-07-08 — No database, no server, no network permission. Local upscale counter via Tauri store plugin.
- 2026-07-08 — UI is a single explicit state machine: idle → fileReady → processing → done | error.
- 2026-07-08 — Phase 1 structure: pure logic in `src/lib/` (app-state.ts, files.ts — both unit-tested), UI in `src/components/` (drop-zone, factor-picker), tokens in `src/styles/tokens.css`. App.tsx owns the reducer + Tauri drag-drop/dialog wiring.
- 2026-07-08 — Tauri file drops arrive as WINDOW events via `getCurrentWebview().onDragDropEvent`, NOT HTML5 drag&drop. Browse uses `@tauri-apps/plugin-dialog`.
- 2026-07-08 — Removed the scaffold's demo `greet` command + opener plugin. Capabilities currently: `core:default` + `dialog:default` only.
- 2026-07-08 — Tooling: ESLint (flat config, no-explicit-any=error) + Prettier + Vitest. Scripts: `npm test`, `npm run lint`, `npm run format`.

## 🐛 Known Issues & Quirks

_(Log current bugs or weird workarounds here)_

- 16x chaining can exhaust RAM/VRAM on older machines — must warn pre-flight and fail gracefully with a "try 4x" suggestion.
- Unsigned installers trigger SmartScreen/"unidentified developer" warnings — documented bypass instructions go on the landing page (not fixable on $0).
- Sidecar executable must be renamed to the platform target triple (e.g., `upscaler-x86_64-unknown-linux-gnu`) or Tauri won't bundle it.

## 📜 Completed Phases

- [x] Phase 1: Scaffold (Tauri app + dark shell UI + file drop) — done 2026-07-08
- [ ] Phase 2: Sidecar integration (engine bundled + executable from frontend)
- [ ] Phase 3: Upscale logic (all four factors + progress/error states + output naming)
- [ ] Phase 4: Harden & ship (error matrix, counter, builds, GitHub release)
