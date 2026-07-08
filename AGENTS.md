# AGENTS.md — Master Plan for MaxRes

## Project Overview & Stack

**App:** MaxRes
**Overview:** A free, 100% offline AI image upscaler for casual, non-technical users (like Maria, 52, restoring family photos). Users drag a photo in, pick 2x/4x/8x/16x, and get a crisp, print-ready image saved next to the original. Photos never leave the device — no accounts, no telemetry, no network calls. Distributed free via GitHub Releases.
**Stack:** Tauri v2 (app shell, desktop-first) + React + TypeScript + Vite (UI) + `realesrgan-ncnn-vulkan` bundled as a Tauri sidecar (the AI engine — a pre-built executable, we never write ML code)
**Critical Constraints:**

- **$0 budget** — free/open-source tools only, no paid services ever
- **Offline-only** — zero network calls in app code; no analytics/telemetry libraries
- **~1 week to desktop launch** — Android is a fast-follow, NOT an MVP blocker (sidecars don't work on Tauri mobile; needs separate engine work later)
- **"Works perfectly" beats fast/pretty** — reliability on machines we didn't build on is the top priority
- **User is a vibe-coder** — explain what you build in plain English as you build it

## Setup & Commands

Execute these commands for standard development workflows. Do not invent new package manager commands.

- **Setup:** `npm install`
- **Development:** `npm run tauri dev`
- **Testing:** `npm test` (Vitest — once configured; manual test matrix in `agent_docs/testing.md` is the primary gate)
- **Linting & Formatting:** `npm run lint` (ESLint + Prettier — once configured)
- **Build (installers):** `npm run tauri build`

## Current Phase Roadmap

Track live progress in `MEMORY.md`. Phases come from the Tech Design blueprint:

1. **Phase 1 — Scaffold:** Tauri v2 app created (React + TS + Vite), runs with `npm run tauri dev`, dark-mode shell UI with drop zone displaying dropped file path
2. **Phase 2 — Sidecar:** `realesrgan-ncnn-vulkan` placed in `src-tauri/binaries/` (target-triple named), tauri.conf.json + capabilities configured, sidecar executes from frontend
3. **Phase 3 — Upscale logic:** `upscaleImage(inputPath, factor)` with factor orchestration (4x native; 2x = 4x→downscale; 8x = two passes→downscale; 16x = two passes + Experimental warning), progress/error states, output saved as `name_4x.png`
4. **Phase 4 — Harden & ship:** error matrix tested (bad file, huge file, cancel, offline), local upscale counter, cross-platform builds, GitHub release

## Protected Areas

Do NOT modify these areas without explicit human approval:

- **`src-tauri/capabilities/` and the security/permissions sections of `tauri.conf.json`** — permission grants are minimal by design (sidecar, dialog, fs only; NO network). Widening them breaks the privacy promise.
- **`src-tauri/binaries/`** — the AI engine executable and models; never rename/delete without approval.
- **`.github/workflows/`** — deployment/CI workflows.
- **`docs/`** — PRD, Tech Design, and research are source-of-truth documents; agents read them, humans edit them.

## Coding Conventions

- **Formatting:** ESLint/Prettier rules strictly. No warnings allowed in new code.
- **Architecture rules:** Keep upscaling orchestration logic in `src/lib/` (e.g., `upscaler.ts`), UI components in `src/components/`. Components render state; they do not spawn processes directly.
- **UI state:** One explicit state machine: `idle → fileReady → processing → done | error`. No ad-hoc boolean soup.
- **Styling:** Design tokens from `src/styles/tokens.css` ONLY — no raw hex values or magic pixel numbers in components (see `agent_docs/tech_stack.md`).
- **Testing Expectations:** Pure logic (factor chaining, filename suffixing) gets Vitest unit tests. Every feature passes the manual checks in `agent_docs/testing.md` before it is "done".
- **Type Safety:** Strict TypeScript. No `any` — use `unknown` with type guards.

## How I Should Think

1. **Understand Intent First**: Before answering, identify what the user actually needs
2. **Ask If Unsure**: If critical information is missing, ask before proceeding
3. **Plan Before Coding**: Propose a plan, ask for approval, then implement
4. **Verify After Changes**: Run tests/linters or manual checks after each change
5. **Explain Trade-offs**: When recommending something, mention alternatives
6. **Explain As You Build** (vibe-coder user): after each change, add a 2-3 sentence plain-English summary of what was built and why

## Plan → Execute → Verify (Required)

- **Plan:** Outline a brief approach and ask for approval before coding.
- **Execute:** Implement one feature at a time — never two phases at once.
- **Verify:** Run checks from `REVIEW-CHECKLIST.md` and `agent_docs/testing.md` after each feature; fix before moving on.
- **Checkpoint:** `git commit` after every working step so the user can always rewind.

## What NOT To Do

- Do NOT delete files without explicit confirmation
- Do NOT add features not in the current phase (no batch, no preview slider, no extra models — they are v1.1+, see `agent_docs/product_requirements.md`)
- Do NOT add ANY network call, analytics, telemetry, or auto-update ping — offline is the product's core promise
- Do NOT widen Tauri permissions/capabilities beyond sidecar + dialog + fs
- Do NOT build shell command strings from file paths — always pass paths as sidecar args (injection safety)
- Do NOT skip tests or manual checks for "simple" changes
- Do NOT bypass failing tests or pre-commit hooks
- Do NOT use deprecated libraries or patterns
- Do NOT let 16x fail silently — warn before, error gracefully after (suggest 4x)

## Agent Behaviors

These rules apply across all AI coding assistants (Cursor, Copilot, Claude, Gemini):

1. **Plan Before Execution:** ALWAYS propose a brief step-by-step plan before changing more than one file.
2. **Refactor Over Rewrite:** Prefer refactoring existing functions incrementally rather than completely rewriting large blocks of code.
3. **Context Compaction:** Write states to `MEMORY.md` instead of filling context history during long sessions.
4. **Iterative Verification:** Run tests or linters after each logical change. Fix errors before proceeding (See `REVIEW-CHECKLIST.md`).
5. **Documentation:** Details live in `agent_docs/` — tech stack (`tech_stack.md`), patterns (`code_patterns.md`), requirements (`product_requirements.md`), testing (`testing.md`), brief (`project_brief.md`).
