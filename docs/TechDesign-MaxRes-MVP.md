# Technical Design Document: MaxRes MVP

## How We'll Build It

### Recommended Approach: Tauri v2 Desktop App with a Bundled AI Engine

Based on your PRD, $0 budget, ~1 week timeline, and "works perfectly" priority, here's the optimal path:

**Primary Recommendation: Tauri v2 + React + Vite + realesrgan-ncnn-vulkan sidecar**

- **Why it's perfect for you:**
  - One codebase covers Windows/macOS/Linux today AND Android later (Tauri v2 targets mobile)
  - The AI engine is a pre-built free executable — no machine learning knowledge needed
  - Tiny installers (~10MB app + ~50MB model) vs Electron's 150MB+
  - GitHub Copilot knows React extremely well — ideal for AI-written code with explanations
- **What it costs:** $0 — everything is free and open source
- **Time to learn:** 1-2 days of guided setup; you'll understand the moving pieces as we go
- **Limitations to know:** unsigned-app warnings, 16x memory limits, and mobile sidecar caveat (see Important Limitations)

### Alternative Options Compared

| Option                | Pros                                                   | Cons                                                                                                 | Cost | Time to MVP |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---- | ----------- |
| **Tauri v2 (chosen)** | Tiny, fast, free, desktop+mobile path, sidecar support | Requires Rust toolchain installed (you won't write Rust)                                             | $0   | ~1 week     |
| Electron + React      | Most tutorials, mature                                 | 150MB+ apps, RAM-hungry, no mobile path                                                              | $0   | ~1 week     |
| Flutter               | True native mobile + desktop                           | Dart is less AI-assistant-friendly; bundling an executable sidecar is harder                         | $0   | 2-3 weeks   |
| Web app (browser)     | No install, no warnings                                | Can't reliably run heavy AI offline; WebGPU upscaling is immature; "offline & private" pitch weakens | $0   | 1-2 weeks   |

**Trade-off honesty:** Tauri's community is smaller than Electron's. But your research blueprint is Tauri-specific, the sidecar feature is exactly what MaxRes needs, and it's the only $0 path that keeps mobile possible in the same codebase.

## Project Setup Checklist

### Step 1: Create Accounts (Day 1)

- [ ] GitHub account (hosting code + releases) — github.com
- [ ] Vercel or Netlify account (landing page, later) — vercel.com / netlify.com
- [ ] No other accounts needed — there is no backend, no database service

### Step 2: AI Assistant Setup (Day 1)

- [x] VS Code + GitHub Copilot — already set up (you're using it now)
- [ ] Ask Copilot to explain anything it generates — your "understand what's built" preference

### Step 3: Install Build Tools (Day 1)

- [ ] Install Node.js LTS — nodejs.org
- [ ] Install Rust — rustup.rs (one command; Tauri needs it to compile, you never write Rust)
- [ ] Linux only: install Tauri system packages (webkit2gtk etc. — Copilot can give the exact `apt` command)

### Step 4: Project Initialization (Day 1)

```bash
npm create tauri-app@latest
# Choose: React, TypeScript, Vite
cd maxres
npm install
npm run tauri dev   # confirms everything works before building features
```

### Step 5: Get the AI Engine (Day 2)

1. Download `realesrgan-ncnn-vulkan` from the Real-ESRGAN GitHub Releases page (free, ~50MB with models)
2. Create `src-tauri/binaries/` in the project
3. Rename the executable to match your platform's target triple (e.g., `upscaler-x86_64-unknown-linux-gnu`) and place it there with the `models/` folder
4. Configure it as a Tauri **sidecar** via `@tauri-apps/plugin-shell` (Copilot prompt provided below)

## Building Your Features

### Feature 1: Multi-Factor AI Upscaling (2x/4x/8x/16x) — P0

**Complexity:** Medium (the engine does the hard part; we orchestrate)

**How the factors work** (the engine natively outputs 4x):

| Button | What happens under the hood                                                      |
| ------ | -------------------------------------------------------------------------------- |
| 2x     | Run engine once (4x) → downscale result 50%                                      |
| 4x     | Run engine once. Done                                                            |
| 8x     | Run engine twice (4x → 16x) → downscale 50%                                      |
| 16x    | Run engine twice (4x → 16x) — labeled "Experimental", memory warning shown first |

**Copilot prompts (in order):**

1. _"I'm using Tauri v2 with the shell plugin. I placed a sidecar executable called 'upscaler' in src-tauri/binaries/. Walk me through configuring tauri.conf.json and the capabilities file so my React frontend can execute it. Explain each config line."_
2. _"Write a TypeScript function `upscaleImage(inputPath, factor)` that runs the sidecar with args `-i input -o output -n realesrgan-x4plus`, chains two passes for 8x/16x using a temp file, and downscales via canvas for 2x/8x. Explain the flow."_
3. _"Add error handling: if the sidecar exits non-zero or the output file is missing, show a friendly error. If the image is huge and factor is 16x, warn before starting."_

**"Works perfectly" safeguards (your priority):**

- Validate the file is actually an image (check extension AND let the engine reject bad files gracefully)
- Free disk space check before writing output
- Timeout + cancel button so a stuck job never freezes the app
- Test matrix: small JPG, large PNG, transparent PNG, weird filename with spaces

#### Data/Backend Needs

- **What to store:** nothing remote — output saved next to original as `photo_4x.png`
- **Local counter:** images-upscaled count in Tauri's local store (privacy-safe, never sent anywhere)
- **API endpoints:** none — there is no server

### Feature 2: Drag & Drop Simple UI — P0

**Complexity:** Easy

**Copilot prompt:**
_"Create a clean, modern, dark-mode UI in App.tsx for my Tauri v2 + React app. One screen: a large drop zone saying 'Drop an image to upscale', four factor buttons (2x, 4x, 8x, 16x — 16x marked Experimental), a progress state, and a done state with 'Show file' and 'Upscale another' buttons. Use Tauri's file-drop event, plus a click-to-browse fallback with the dialog plugin. Explain the component structure."_

**States to implement:** `idle → fileReady → processing → done | error` — a simple state machine keeps this un-breakable.

### Feature 3: 100% Offline / Private Processing — P0

**Complexity:** Easy (it's the default — we just must not break it)

- No `fetch()` calls anywhere in the app — Copilot instructed to never add analytics/telemetry
- Tauri capabilities locked down: only shell-sidecar, dialog, and file-system permissions — no network permission granted
- **Verification test:** disable Wi-Fi → full upscale must succeed
- In-app footer: "100% offline — your photos never leave your device"

**Security notes (addressing your worry):**

- Offline-by-design removes the biggest risks: no accounts, no data breaches possible, no servers to hack
- Remaining care: treat dropped file paths safely (pass as args, never build shell strings), keep Tauri permissions minimal

## Design Implementation

### Matching Your PRD Vision: "Clean, dark, minimal"

#### Design System Setup

```css
/* Core tokens — dark, focused, lets photos pop */
--bg: #101014; /* near-black background */
--surface: #1a1a21; /* cards / drop zone */
--border: #2a2a33;
--text: #e8e8ee;
--text-dim: #8a8a96;
--accent: #4f8cff; /* single blue accent for actions */
--success: #3ddc84;
--danger: #ff5c5c;
--radius: 12px;
--font-main: system-ui, -apple-system, "Segoe UI", sans-serif;
```

Rule for Copilot: **use tokens only — no raw hex values in components.**

#### Layout & Responsiveness

- Single centered column, max-width 480px — looks right on desktop windows and phone screens alike
- Buttons min 48px tall (touch-friendly, per PRD)
- Test by resizing the window down to 360px wide

## Database & Data Storage

**None needed.** MaxRes is a local tool:

| Data                    | Where it lives                       |
| ----------------------- | ------------------------------------ |
| Input/output images     | User's own disk, next to originals   |
| Images-upscaled counter | Tauri store plugin (local JSON file) |
| Settings (none in MVP)  | —                                    |

This is a feature, not a shortcut: no database = nothing to secure, pay for, or maintain.

## Product AI Features

- **Use case:** local image super-resolution only (Real-ESRGAN x4plus model)
- **Provider:** local executable — no API keys, no per-use cost, no rate limits
- **Data sensitivity:** photos never leave the device — strongest possible privacy posture
- **Failure fallback:** friendly error + suggestion to try a lower factor; never a silent fail (per PRD quality standards)
- **No extra AI features in MVP** (confirmed)

## AI Assistance Strategy

### Your Tool: VS Code + GitHub Copilot (agent mode)

| Task               | How to use Copilot                                                           |
| ------------------ | ---------------------------------------------------------------------------- |
| Building features  | Paste the phase prompts from this doc; ask "explain the structure" after     |
| Understanding code | "Explain this file like I'm new to React, line by line"                      |
| Fixing bugs        | Paste the exact error + what you expected; ask for the why, not just the fix |
| Stuck > 30 min     | Ask Copilot to "take a completely different approach to X"                   |

### Debugging Template (for your "breaking things" worry)

```
Error in [feature]:
[exact error message]
What I did: [steps]
Expected: [what should happen]
Please explain the cause in plain English, then fix it.
```

### Anti-stuck insurance (your #1 worry)

- Commit to git after EVERY working step: `git add . && git commit -m "drop zone works"` — you can always rewind to the last working state
- Tauri Discord + GitHub Discussions are active and beginner-friendly
- The research blueprint's 4 phases are your map — never work on two phases at once

## Deployment Plan

### Recommended: GitHub Releases + free landing page

#### Why:

- **$0** — GitHub hosts unlimited release downloads free
- **Download counts** are public — one of your PRD success metrics
- **Stars live where the app lives** — traction compounds

#### Deployment Steps:

1. `npm run tauri build` → produces `.msi`/`.exe` (Windows), `.dmg` (macOS), `.AppImage`/`.deb` (Linux)
2. Create a public GitHub repo → "Releases" → attach installers → publish v1.0
3. Landing page (1 page, dark, matching app) on Vercel/Netlify free tier → download buttons link straight to release files
4. Add the "unidentified developer" workaround instructions to the page (right-click → Open on macOS; "More info → Run anyway" on Windows)

### Backup Options:

- **Itch.io:** friendly indie distribution if GitHub feels too developer-y for Maria-type users
- **F-Droid (later):** for the Android build — free, trusted by privacy-minded users

## Cost Breakdown

> All items verified free as of 2026-07. No credit card required anywhere.

### Development Phase

| Service                         | Free Tier                  | Notes                              |
| ------------------------------- | -------------------------- | ---------------------------------- |
| VS Code + GitHub Copilot        | Yes (Copilot free tier)    | You already have it                |
| Tauri, React, Vite, Rust, Node  | Free forever (open source) | —                                  |
| realesrgan-ncnn-vulkan + models | Free (BSD-3 license)       | Verify license file ships with app |
| **Total**                       | **$0/month**               |                                    |

### Production Phase

| Service                     | Cost             | Notes                                    |
| --------------------------- | ---------------- | ---------------------------------------- |
| GitHub repo + Releases      | $0               | Unlimited public downloads               |
| Vercel/Netlify landing page | $0               | Free tier far exceeds needs              |
| Code signing                | **skipped** ($0) | The one real trade-off — see Limitations |
| **Total**                   | **$0/month**     |                                          |

## Scaling Path

**100 users:** nothing changes — no servers means no scaling pressure. Watch GitHub Issues.
**1,000 users:** add before/after slider (v1.1), batch processing; consider donations (GitHub Sponsors, $0 to set up) to fund code signing.
**10,000 users:** code-sign installers (~$99/yr Apple + Windows cert) to remove scary warnings; start Android build; add auto-updates via Tauri updater.

## Important Limitations

### What This Approach CAN'T Do:

1. **Signed installers on $0:** users see OS security warnings
   - _Workaround:_ friendly bypass instructions on the landing page; sign later when donations cover it
2. **16x on low-RAM machines:** chained passes on big images can exhaust memory
   - _Workaround:_ "Experimental" label + pre-flight warning + graceful error suggesting 4x (already in PRD success criteria)
3. **Mobile sidecar (the big one):** Tauri v2 mobile does NOT support desktop-style sidecar executables — the Android build needs a different engine integration (e.g., NCNN via native library or ONNX Runtime Mobile)
   - _Workaround:_ per your PRD mitigation — desktop ships on time; Android is a fast-follow with its own engine work. **Do not let this block the launch.**
4. **iOS on $0:** Apple's $99/yr developer fee blocks distribution
   - _Workaround:_ deferred until budget exists (already in PRD)

### When You'll Need to Upgrade:

- Users demand "no warnings" install → buy code signing (~$99-200/yr)
- Android demand is real → budget 1-2 focused weeks for the mobile engine port

## Learning Resources

### Essential for Your Stack

1. **Tauri v2 Getting Started:** tauri.app/start — official, current
2. **Tauri sidecar guide:** tauri.app → "Embedding External Binaries"
3. **React basics:** react.dev/learn (only the "Describing the UI" section — that's all MVP needs)

### Community Support (your "getting stuck" insurance)

- **Tauri Discord:** discord.com/invite/tauri — active, beginner-tolerant
- **Real-ESRGAN GitHub Issues:** for engine-specific oddities
- **r/tauri, r/reactjs:** searchable past answers

## Success Checklist

### Before Starting Development

- [ ] Node.js + Rust installed, `npm run tauri dev` shows a window
- [ ] Engine executable downloaded and runs from terminal on a test image
- [ ] Git repo initialized, first commit made
- [ ] Understood the 4 limitations above

### During Development

- [ ] Following PRD features only (3 P0s — nothing else)
- [ ] Commit after every working step
- [ ] Testing each factor (2x/4x/8x/16x) after wiring
- [ ] Asking Copilot to explain anything unclear

### Before Launch

- [ ] All 3 P0 features work per PRD success criteria
- [ ] Offline test passed (Wi-Fi off → upscale succeeds)
- [ ] Error cases tested: bad file, huge file, cancel mid-job
- [ ] Tested on Windows AND macOS (borrow a machine or ask a friend)
- [ ] Landing page live with bypass instructions
- [ ] GitHub release published

## Definition of Technical Success

Your technical implementation is successful when:

- It upscales real photos reliably on machines you didn't build it on ("works perfectly")
- All 3 PRD features work with no silent failures
- It's downloadable from GitHub Releases via the landing page
- You can explain what each part of the app does
- Monthly costs are exactly $0
- You can ship a v1.1 (before/after slider) yourself with Copilot

---

_Technical Design for: MaxRes_
_Approach: Tauri v2 + React + local AI sidecar (AI-assisted, explained as built)_
_Estimated Time to MVP: ~1 week (desktop), Android fast-follow_
_Estimated Cost: $0/month_
