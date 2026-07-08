# System Memory & Context 🧠
<!--
AGENTS: Update this file after every major milestone, structural change, or resolved bug.
DO NOT delete historical context if it is still relevant. Compress older completed items.
-->

## 🏗️ Active Phase & Goal
**Current Task:** Phase 1 — Scaffold: create the Tauri v2 app (React + TypeScript + Vite) and get the dark-mode shell UI running
**Next Steps:**
1. Install prerequisites: Node.js LTS, Rust (rustup), Linux webkit2gtk packages
2. Run `npm create tauri-app@latest` (React, TypeScript, Vite) and confirm `npm run tauri dev` opens a window
3. Build the one-screen dark UI: drop zone ("Drop an image to upscale") + 2x/4x/8x/16x buttons (16x marked Experimental) using design tokens
4. Wire Tauri file-drop event + click-to-browse fallback; display the selected file path in state

## 📂 Architectural Decisions
*(Log specific choices made during the build here so future agents respect them)*
- 2026-07-08 — Chose Tauri v2 over Electron/Flutter/web: tiny bundles, sidecar support, $0, and a future mobile path in one codebase (see docs/TechDesign-MaxRes-MVP.md).
- 2026-07-08 — AI engine is `realesrgan-ncnn-vulkan` as a bundled sidecar; app orchestrates factors (4x native; 2x = 4x→50% downscale; 8x = 4x→4x→50% downscale; 16x = two chained passes, Experimental).
- 2026-07-08 — Desktop-first: ship Windows/macOS/Linux on time; Android is a fast-follow (Tauri mobile does NOT support desktop-style sidecars — needs separate engine integration). iOS blocked by $0 budget (Apple fee).
- 2026-07-08 — No database, no server, no network permission. Local upscale counter via Tauri store plugin.
- 2026-07-08 — UI is a single explicit state machine: idle → fileReady → processing → done | error.

## 🐛 Known Issues & Quirks
*(Log current bugs or weird workarounds here)*
- 16x chaining can exhaust RAM/VRAM on older machines — must warn pre-flight and fail gracefully with a "try 4x" suggestion.
- Unsigned installers trigger SmartScreen/"unidentified developer" warnings — documented bypass instructions go on the landing page (not fixable on $0).
- Sidecar executable must be renamed to the platform target triple (e.g., `upscaler-x86_64-unknown-linux-gnu`) or Tauri won't bundle it.

## 📜 Completed Phases
- [ ] Phase 1: Scaffold (Tauri app + dark shell UI + file drop)
- [ ] Phase 2: Sidecar integration (engine bundled + executable from frontend)
- [ ] Phase 3: Upscale logic (all four factors + progress/error states + output naming)
- [ ] Phase 4: Harden & ship (error matrix, counter, builds, GitHub release)
