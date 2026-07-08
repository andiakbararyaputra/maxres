# Product Requirements Document: MaxRes MVP

## Product Overview

**App Name:** MaxRes
**Tagline:** Make any photo print-ready — free, private, and stupidly simple.
**Launch Goal:** Open-source traction (GitHub stars + real downloads)
**Target Launch:** ~1 week (aggressive "days" timeline)

## Who It's For

### Primary User: The Casual Photo Restorer
Everyday people — not designers, not techies — with old, small, or blurry photos they want to print, frame, or share.

**Their Current Pain:**
- Old scanned/family photos are too low-res to print without looking blocky
- Good tools cost real money (Topaz Gigapixel ≈ $99)
- Free web upscalers require uploading private family photos to unknown servers
- Existing free tools (waifu2x, CLI tools) are confusing for non-technical people

**What They Need:**
- One obvious action: drop photo → pick size → done
- Zero cost, zero account, zero learning curve
- Photos never leave their device

### Example User Story
"Meet Maria, 52, who scans an old family photo of her parents but it's tiny and blurry. She finds MaxRes, drags the photo in, taps 4x, and 30 seconds later has a crisp print-ready version — without uploading her family's photos to some website. She prints it for her mother's birthday."

## The Problem We're Solving

Billions of photos exist at resolutions too low for modern screens and printing. AI super-resolution solves this, but today's options force a bad trade-off: pay, learn complicated software, or give up privacy. MaxRes removes all three barriers — free, simple, offline.

**Why Existing Solutions Fall Short:**
- **Topaz Gigapixel AI:** Excellent quality but ~$99 — too much for occasional use
- **waifu2x:** Free but anime-focused and confusing UX for casual users
- **Web upscalers (Bigjpg, Let's Enhance):** Upload required — privacy risk + file size limits + paywalls
- **Upscayl (open source):** Great, but desktop-only and geared toward tinkerers; MaxRes aims simpler + mobile

## User Journey

### Discovery → First Use → Success

1. **Discovery Phase**
   - How they find us: GitHub, Reddit (r/opensource, r/photorestoration), word of mouth
   - What catches attention: "Free forever. 100% offline. No account."
   - Decision trigger: they have a specific photo they need enlarged *today*

2. **Onboarding (First 5 Minutes)**
   - Land on: single screen with one big drop zone — "Drop an image to upscale"
   - First action: drag photo in (or tap to browse)
   - Quick win: pick 2x/4x/8x/16x → progress bar → upscaled file saved next to original

3. **Core Usage Loop**
   - Trigger: another photo needs enlarging
   - Action: drop → pick factor → wait seconds
   - Reward: crisp result, saved locally
   - Investment: it becomes "the photo enlarger" on their machine

4. **Success Moment**
   - "Aha!": seeing a blurry memory become print-quality
   - Share trigger: showing the restored photo to family → "what app did you use?"

## MVP Features

### Must Have for Launch

#### 1. Multi-Factor AI Upscaling (2x / 4x / 8x / 16x)
- **What:** AI super-resolution (Real-ESRGAN) with four size options; 4x native, 2x downscaled from 4x, 8x/16x via chained passes
- **User Story:** As a photo owner, I want to choose how much bigger my image gets so the result fits my need (screen vs print)
- **Success Criteria:**
  - [ ] All four factors produce a correct-size, visibly sharper output image
  - [ ] 16x is labeled "Experimental" with a memory warning (may fail on older machines)
  - [ ] Output auto-saved next to the original with a clear suffix (e.g., `photo_4x.png`)
- **Priority:** P0 (Critical)

#### 2. Drag & Drop Simple UI
- **What:** One screen: drop zone, four size buttons, progress indicator, done state — nothing else
- **User Story:** As a non-technical user, I want to drop a photo and press one button so that I never feel lost
- **Success Criteria:**
  - [ ] A first-time user completes an upscale with zero instructions
  - [ ] Drag & drop AND tap-to-browse both work
  - [ ] Clear progress feedback while processing; clear success/failure message after
- **Priority:** P0 (Critical)

#### 3. 100% Offline / Private Processing
- **What:** All AI processing on-device; app makes no network calls; no account, no telemetry
- **User Story:** As a privacy-conscious user, I want my photos to never leave my device so I can trust the app with family pictures
- **Success Criteria:**
  - [ ] Full upscale works with network disabled
  - [ ] Zero outbound network requests (verifiable)
  - [ ] "Works offline — your photos never leave your device" stated in-app
- **Priority:** P0 (Critical)

### Nice to Have (If Time Allows)
- **Before/after comparison slider**: first thing to add if MVP finishes early — it's the "wow" moment

### NOT in MVP (Saving for Later)
- **Before/after preview slider**: Will add in v1.1, right after launch
- **Batch processing**: Will add after core single-image flow is proven stable
- **Extra AI enhancements (denoise, face restore, colorize)**: After traction milestone (~100 stars)
- **Multiple AI model choices (photo/anime/art)**: After v2 — one good default model first
- **Multi-language support**: After v2 — English-only at launch

*Why we're waiting: a days-long timeline only survives with a ruthlessly small scope.*

## How We'll Know It's Working

### Launch Success Metrics (First 30 Days)
| Metric | Target | Measure |
|--------|--------|---------|
| GitHub stars | 100 | GitHub repo insights |
| Downloads | 500 | GitHub Releases download count |
| Images upscaled | Qualitative | Local-only counter shown in app (privacy-safe, no telemetry); users share screenshots/feedback |

### Growth Metrics (Months 2-3)
| Metric | Target | Measure |
|--------|--------|---------|
| GitHub stars | 500 | GitHub insights |
| Community engagement | 10+ issues/discussions | GitHub activity |

## Look & Feel

**Design Vibe:** Clean, dark, minimal

**Visual Principles:**
1. One screen, one job — no menus, no settings pages in MVP
2. Dark mode by default — modern, focused, lets photos pop
3. Big touch-friendly targets — same UI logic works on desktop and phone

**Key Screens/Pages:**
1. **Main screen**: drop zone + 2x/4x/8x/16x buttons
2. **Processing state**: progress indicator with friendly status text
3. **Done state**: success message + "Show file" / "Upscale another" actions

### Simple Wireframe
```
[Main Screen]
┌─────────────────────────┐
│        MaxRes           │
├─────────────────────────┤
│                         │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ┐     │
│     Drop an image       │
│   │  to upscale    │    │
│    ─ ─ ─ ─ ─ ─ ─ ─      │
│                         │
├─────────────────────────┤
│ [2x] [4x] [8x] [16x*]   │
│   *experimental         │
├─────────────────────────┤
│ ● 100% offline & free   │
└─────────────────────────┘
```

## Technical Considerations

**Platform:** Desktop (Windows/macOS/Linux) + Mobile (Android/iOS) — see Risks
**Stack direction (from research):** Tauri v2 + React + Vite, with `realesrgan-ncnn-vulkan` as a bundled sidecar; Tauri v2 also targets mobile
**Responsive:** Yes — single adaptive layout
**Performance:** 4x upscale of a typical photo completes in under ~60s on a 5-year-old machine
**Accessibility:** Keyboard-operable, readable contrast (dark theme AA), labeled controls
**Security/Privacy:** No network calls, no accounts, no analytics; files stay local
**Scalability:** Not applicable (no servers) — scale = downloads, which GitHub handles

## Quality Standards

**What This App Will NOT Accept:**
- Placeholder content in production ("Lorem ipsum", sample images)
- Broken features — everything listed works or isn't included
- Shipping a size factor (e.g., 16x) that silently fails — warn or disable instead
- Skipping mobile testing before claiming mobile support
- Ignoring accessibility basics

*These standards will be enforced by the AI coding assistant.*

## Budget & Constraints

**Development Budget:** $0 — free/open-source tools only
**Monthly Operating:** $0 (GitHub Releases hosting + free Vercel/Netlify landing page)
**Timeline:** ~1 week to first public release
**Team:** Solo (vibe-coder + AI coding assistant)

**Known $0-budget trade-offs:**
- Unsigned installers → OS security warnings (SmartScreen / "unidentified developer"); mitigation: right-click-open instructions on the site
- **iOS is effectively blocked on $0** (Apple requires a $99/yr developer account to distribute) → mobile MVP means **Android APK sideload / F-Droid**; iOS deferred until budget exists

## Open Questions & Assumptions

**Top Risk (flagged honestly):** Research strongly recommended desktop-first; founder chose to keep mobile in MVP. Mobile on-device AI upscaling (sidecar binaries don't work the same way on mobile; VRAM/RAM limits) may not be achievable in days.
- **Mitigation:** Build desktop first inside the Tauri v2 codebase (which supports mobile targets). If mobile threatens the launch date, ship desktop on time and make Android a fast-follow.

**Other open questions:**
- Does chained 16x complete on mid-range hardware, or should it be auto-disabled below a RAM threshold?
- Best default output format (PNG vs JPG) for casual users?

**Assumptions:**
- One good default model (Real-ESRGAN x4plus) is enough for photo restoration use cases
- Casual users will tolerate the unsigned-app warning if instructions are friendly
- GitHub Releases is an acceptable download experience for non-technical users if the landing page links directly

## Launch Strategy (Brief)

**Soft Launch:** GitHub release + simple landing page (Vercel/Netlify free tier)
**Target Users:** 10-20 friends/family first, then Reddit (r/opensource, r/DataHoarder, r/photorestoration) and Hacker News "Show HN"
**Feedback Plan:** GitHub Issues + a "Feedback" link in-app (opens GitHub, no tracking)
**Iteration Cycle:** Weekly releases for the first month (v1.1 = before/after slider)

## Definition of Done for MVP

The MVP is ready to launch when:
- [ ] All 3 P0 features are functional
- [ ] Basic error handling works (bad file type, out-of-memory, cancelled job)
- [ ] It works on Windows + macOS (+ Android if timeline holds)
- [ ] One complete user journey works end-to-end: drop → pick factor → saved result
- [ ] Local-only usage counter works (no telemetry)
- [ ] Friends/family test is complete (5+ people, zero-instruction success)
- [ ] GitHub release with installers is published and linked from the landing page

## Next Steps

After this PRD is approved:
1. Create Technical Design Document (Part 3)
2. Set up development environment (Node.js, Rust, Tauri v2)
3. Build MVP with AI assistance (follow the 4-phase blueprint from research)
4. Test with 5-10 beta users
5. Launch!

---
*Document created: 2026-07-08*
*Status: Draft — Ready for Technical Design*
