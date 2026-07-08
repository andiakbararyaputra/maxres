# GitHub Copilot Instructions for MaxRes

## Project Context

**App:** MaxRes — free, 100% offline AI image upscaler (2x/4x/8x/16x) for casual users
**Stack:** Tauri v2 + React + TypeScript + Vite, with `realesrgan-ncnn-vulkan` as a bundled sidecar
**Stage:** MVP Development (desktop-first; Android fast-follow)
**User Level:** Vibe-coder — explain what you build in plain English as you build it

## Directives

1. Read `AGENTS.md` first — it has the current phase, constraints, and protected areas. Track live state in `MEMORY.md`.
2. Refer to `agent_docs/` for details: `tech_stack.md` (stack + sidecar facts), `code_patterns.md` (patterns), `product_requirements.md` (scope), `testing.md` (quality gates), `project_brief.md` (conventions).
3. Plan-first: propose a brief plan and wait for approval before coding. One feature at a time.
4. Follow existing code conventions; strict TypeScript, no `any`; design tokens only — no raw hex values in components.
5. NEVER add network calls, analytics, or telemetry — offline is the product's core promise. Never widen Tauri permissions without approval.
6. Verify after each change: `npm test` + `npm run lint` + relevant manual matrix rows from `agent_docs/testing.md`. Update `MEMORY.md` and commit after each working step.
7. Scope guard: only the 3 P0 features (upscaling, drag & drop UI, offline). Preview slider, batch, extra models are v1.1+ — do not build them.

## Commands

- `npm run tauri dev` — run the app in development
- `npm test` — run unit tests (Vitest)
- `npm run lint` — check code style
- `npm run tauri build` — build installers
