# System Memory & Context 🧠

<!--
AGENTS: Update this file after every major milestone, structural change, or resolved bug.
DO NOT delete historical context if it is still relevant. Compress older completed items.
-->

## 🏗️ Active Phase & Goal

**Current Task:** Phase 4 code COMPLETE ✅ — only the user-side GitHub publish remains (create repo, push, tag v0.1.0 → CI builds installers)
**Next Steps (publish — user does these):**

1. Create empty GitHub repo `andiakbararyaputra/maxres` (no README/license — we have them)
2. `git remote add origin ...`, `git push -u origin main`
3. `git tag v0.1.0 && git push origin v0.1.0` → release.yml builds Win/mac/Linux → draft Release
4. Review draft release, publish it; deploy `landing/` to Netlify/Vercel (drag-drop the folder)
5. Post-launch: verify Windows DLL loading + macOS Rosetta on real hardware (couldn't test on Linux)

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
- 2026-07-08 — Phase 2: engine v0.2.5.0 (20220424 ubuntu build) bundled at `src-tauri/binaries/upscaler-x86_64-unknown-linux-gnu` + `models/` (trimmed to realesrgan-x4plus only, 32MB). Declared via `bundle.externalBin` + `bundle.resources` (models → resource dir, resolved at runtime with `resolveResource("models")`).
- 2026-07-08 — Capability added (approved): scoped `shell:allow-execute` for sidecar `binaries/upscaler` only, args:true. Still NO network/fs permissions.
- 2026-07-08 — `src/lib/upscaler.ts` is the only module that talks to the engine; returns typed UpscaleResult, catches ALL failures including spawn errors (engine-unavailable), OOM detection via stderr `vkAllocateMemory`.
- 2026-07-08 — Phase 2 ships native 4x only; AVAILABLE_FACTORS=[4] in App.tsx gates the buttons.
- 2026-07-08 — Phase 3: engine `-s` flag is BROKEN for non-4 values with realesrgan-x4plus (RMSE 0.43 vs ground truth, corrupted seams — verified). NEVER use -s. Factors built by chaining native 4x passes: 2x = 4x→halve; 8x = 4x→halve→4x (halve BEFORE 2nd pass = memory-friendly); 16x = 4x→4x. Plan logic in `src/lib/plan.ts` (pure, unit-tested planScale invariant).
- 2026-07-08 — Two tiny Rust commands in lib.rs (only non-ML native code): `halve_image` (image crate, PNG-only features, Lanczos3) and `remove_temp_file` (refuses paths outside OS temp dir — safe by construction). No new capabilities needed for them.
- 2026-07-08 — Capability change (approved): `shell:allow-execute` → `shell:allow-spawn` (same sidecar scope) + `shell:allow-kill`, because progress streaming + cancel need spawn()/kill() instead of execute().
- 2026-07-08 — Progress: engine prints "NN.NN%" per pass on stderr; upscaler maps each pass into its plan step's progress range (e.g. 16x pass 1 = 0-50). Reducer ignores backwards PROGRESS events.
- 2026-07-08 — 16x shows a pre-flight `ask()` warning dialog (dialog:default covers it). Cancel kills the current child; cancelled jobs RESET to idle; temp intermediates cleaned in a finally block.
- 2026-07-08 — Pre-ship cleanup (commit 7112f2e): engine stripped 11M→9.7M (byte-identical output verified via sha256); release profile added (LTO, strip, opt-level=s, panic=abort, codegen-units=1) → app binary 5.3M; package renamed maxres-scaffold→maxres (Cargo name + lib `maxres_lib` + main.rs call); demo SVGs removed, favicon → /icon.png; cloned template repo deleted.
- 2026-07-08 — First successful release build: deb 36M, rpm 36M, AppImage 108M (bundles GTK; deb/rpm use system GTK). Installers copied to ~/maxres-installers/. Build cache cleaned (freed 10.5GB); next build recompiles ~5min.
- 2026-07-08 — NOTE: AppImage bundling downloads linuxdeploy/AppRun tooling from GitHub at BUILD time (not runtime) — the shipped app is still fully offline. deb/rpm need no downloads.
- 2026-07-08 — Phase 4 (commits 88cb982, 3a470a4, dffdc09, 2c79194): collision-safe names (`unique_output_path` Rust cmd, unit-tested); local counter via store plugin (`store:default` approved) shown in footer; corrupt-file hardening (`file_exists` cmd + decode-failed stderr detection — engine exits 0 with no output on bad files); GPL-3.0 LICENSE + THIRD_PARTY_LICENSES.md (engine BSD-3) + real README; Win/mac engine binaries added (100M total, 4 targets); vcomp140 DLLs bundled as resources for Windows; release.yml CI workflow (tag v* → all-platform installers); dark landing page in `landing/`.
- 2026-07-08 — GPU: real Intel UHD 620 present (not CPU-only as earlier thought) — engine uses Vulkan, faster than llvmpipe fallback.

## 🐛 Known Issues & Quirks

_(Log current bugs or weird workarounds here)_

- 16x chaining can exhaust RAM/VRAM on older machines — must warn pre-flight and fail gracefully with a "try 4x" suggestion.
- Unsigned installers trigger SmartScreen/"unidentified developer" warnings — documented bypass instructions go on the landing page (not fixable on $0).
- Sidecar executable must be renamed to the platform target triple (e.g., `upscaler-x86_64-unknown-linux-gnu`) or Tauri won't bundle it.
- Dev machine has no GPU Vulkan driver — engine falls back to llvmpipe (CPU): works but slow (220px→4x ≈ 8s). Real GPUs will be much faster; keep test images small in dev.
- LESSON: a chat-applied edit to an OPEN editor file can sit unsaved (● in tab) — the app reads DISK. If config changes seem ignored, `cat` the file to compare. Cost us one debugging round on capabilities.
- LESSON: always try/catch around plugin calls — a rejected promise (e.g. permission denied) otherwise leaves the state machine stuck in `processing` forever.
- LESSON: verify engine output CONTENT, not just dimensions — the -s bug produced correctly-sized but corrupted images. Cheap heuristics (edge stddev) missed it; ground-truth RMSE comparison caught it.
- Engine quirk: exits 0 even on a fully bad decode (prints "decode image ... failed", writes NO output). Handled: upscaler checks `file_exists` + watches for that stderr line. Also can paint gray tiles on low GPU memory — revisit if users report gray patches.
- RISK (untested on Linux): Windows engine needs vcomp140.dll next to the .exe — bundled as resources but real Windows load path unverified. macOS aarch64 reuses the x86_64 engine via Rosetta — verify on real Apple Silicon. Both flagged for post-launch hardware testing.

## 📜 Completed Phases

- [x] Phase 1: Scaffold (Tauri app + dark shell UI + file drop) — done 2026-07-08
- [x] Phase 2: Sidecar integration (engine bundled + native 4x works end-to-end) — done 2026-07-08
- [x] Phase 3: Upscale logic (all four factors via chaining + progress bar + cancel + 16x warning) — done 2026-07-08
- [x] Phase 4: Harden & ship — code done 2026-07-08 (collision-safe names, counter, corrupt-file hardening, docs+license, cross-platform binaries, CI workflow, landing page). Publish = user-side.
