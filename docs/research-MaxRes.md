# Research Findings: MaxRes (Part 1 Deep Research Summary)

> Saved for session continuity. Source: deep research run from Part 1 prompt.

## Key Recommendation
Desktop-first MVP is the smartest move for a non-technical founder on a "days" timeline with a $0 budget: skips mobile app store reviews, bypasses $124 in developer fees, avoids smartphone hardware limits.
*(Founder decision: keep mobile in MVP — documented as top risk in PRD with desktop-first-inside-Tauri mitigation.)*

## 1. The Tech Stack
- **Framework:** Tauri v2 (lightweight desktop apps using web tech)
- **Frontend UI:** React + Vite (drag-and-drop interface)
- **AI Engine:** `realesrgan-ncnn-vulkan` (pre-built free executable, runs AI on the user's GPU)
- **The Bridge:** Tauri Shell Plugin / Sidecar (React UI tells the realesrgan executable to process an image)

## 2. Step-by-Step Implementation Blueprint (4 Phases)

### Phase 1: Project Setup (Day 1)
- Install Node.js and Rust
- `npm create tauri-app@latest` → select React, TypeScript, Vite
- AI prompt: create clean, modern, dark-mode UI in App.tsx with large drag-and-drop zone ("Drop an image to upscale"); on drop, save file path to state and display it

### Phase 2: The AI Engine "Sidecar" (Day 2)
- Download latest realesrgan-ncnn-vulkan .zip from Real-ESRGAN GitHub Releases for your OS
- Unzip → executable + `models` folder
- Create `src-tauri/binaries/`, rename executable to match the platform Target Triple (e.g., `upscaler-x86_64-pc-windows-msvc.exe`, `upscaler-aarch64-apple-darwin`)
- Configure `tauri.conf.json` + capabilities to allow frontend to execute the sidecar via `@tauri-apps/plugin-shell`

### Phase 3: Connecting UI to the AI (Day 3)
- On image drop, run sidecar with args: `-i [input_file_path] -o [output_file_path] -n realesrgan-x4plus`
- Show loading spinner while running; success message when finished

### Phase 4: Before/After Preview (Day 4)
- Use open-source React component like `react-compare-slider`
- Read original + upscaled images via Tauri fs APIs, display in wipe slider
*(Founder decision: preview moved to v1.1, not MVP.)*

## 3. Multi-Factor Upscaling Logic
The native Real-ESRGAN engine processes at exactly **4x**. Orchestrate in the frontend:
- **4x:** run sidecar once
- **2x:** run once (4x) → downscale 50% via HTML/Canvas
- **8x:** run on original (4x) → run again on result (16x) → downscale 50%
- **16x:** chain two passes — *warning: generally unnecessary and may crash older laptops due to VRAM limits; research recommends capping at 8x (founder kept 16x as "Experimental" with warning)*

## 4. Distribution — The $0 Path
1. **Hosting:** free GitHub repository; upload installers to Releases page
2. **Website:** free landing page (Vercel or Netlify template), download buttons link to GitHub release files
3. **The catch:** no code signing on $0 → Windows SmartScreen / macOS "unidentified developer" warnings; add site instructions: "right-click → Open" to bypass

---
*Compiled: 2026-07-08*
