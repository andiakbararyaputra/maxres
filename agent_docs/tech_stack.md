# Tech Stack & Tools

- **App shell:** Tauri v2 — wraps our web UI in a tiny native desktop app (Windows/macOS/Linux now, Android path later). We configure it; we don't write Rust.
- **Frontend:** React 18+ with TypeScript, built by Vite (`npm create tauri-app@latest` → React, TypeScript, Vite)
- **AI Engine:** `realesrgan-ncnn-vulkan` — a pre-built free executable (BSD-3) bundled as a **Tauri sidecar** in `src-tauri/binaries/`. It runs Real-ESRGAN on the user's GPU. Native output is exactly **4x**.
- **Tauri plugins:**
  - `@tauri-apps/plugin-shell` — runs the sidecar
  - `@tauri-apps/plugin-dialog` — click-to-browse file picker
  - `@tauri-apps/plugin-fs` — read/write image files
  - `@tauri-apps/plugin-store` — local-only "images upscaled" counter
- **Styling:** Plain CSS with design tokens (no framework needed for one screen)
- **Backend / Database / Auth:** NONE. Fully local app. No server, no accounts, no network permission.

## Setup Commands

```bash
# prerequisites: Node.js LTS (nodejs.org), Rust (rustup.rs)
# Linux also needs: libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
npm install          # install dependencies
npm run tauri dev    # run the app in development (opens a window)
npm run tauri build  # produce installers (.msi/.exe, .dmg, .AppImage/.deb)
```

## Sidecar Facts (critical — easy to get wrong)

- Executable lives in `src-tauri/binaries/` and MUST be renamed to include the platform target triple, e.g. `upscaler-x86_64-unknown-linux-gnu`, `upscaler-x86_64-pc-windows-msvc.exe`, `upscaler-aarch64-apple-darwin`
- The `models/` folder ships alongside it (bundle as Tauri resources)
- Declared in `tauri.conf.json` under `bundle.externalBin` and permitted in the capabilities file
- Invocation args: `-i <input> -o <output> -n realesrgan-x4plus`
- Factor orchestration happens in OUR TypeScript code:
  - **4x:** one pass. **2x:** one pass → canvas downscale 50%. **8x:** two passes → downscale 50%. **16x:** two passes (warn first — RAM/VRAM heavy)

## Error Handling Pattern

```typescript
// Canonical pattern: every sidecar run returns a typed result — no thrown
// exceptions reach the UI, no silent failures (PRD quality standard).
type UpscaleResult =
  | { ok: true; outputPath: string }
  | {
      ok: false;
      reason: "bad-input" | "engine-failed" | "out-of-memory" | "cancelled";
      message: string;
    };

async function runEngine(
  input: string,
  output: string,
): Promise<UpscaleResult> {
  const command = Command.sidecar("binaries/upscaler", [
    "-i",
    input,
    "-o",
    output,
    "-n",
    "realesrgan-x4plus",
  ]);
  const result = await command.execute();
  if (result.code !== 0) {
    // stderr mentioning vkAllocateMemory usually means the GPU ran out of memory
    const oom = result.stderr.includes("vkAllocateMemory");
    return {
      ok: false,
      reason: oom ? "out-of-memory" : "engine-failed",
      message: oom
        ? "Not enough memory for this size. Try 4x instead."
        : "The upscaler could not process this image. Is it a valid JPG/PNG?",
    };
  }
  return { ok: true, outputPath: output };
}
```

## Styling & Component Example

```tsx
// Components use design tokens only — never raw hex values.
// tokens.css: --bg:#101014 --surface:#1a1a21 --border:#2a2a33 --text:#e8e8ee
//             --text-dim:#8a8a96 --accent:#4f8cff --success:#3ddc84
//             --danger:#ff5c5c --radius:12px
export function FactorButton({
  factor,
  experimental,
  onSelect,
}: {
  factor: 2 | 4 | 8 | 16;
  experimental?: boolean;
  onSelect: (factor: number) => void;
}) {
  return (
    <button
      className="factor-btn" /* styled via tokens: background var(--surface), 48px min height */
      aria-label={`Upscale ${factor} times${experimental ? " (experimental)" : ""}`}
      onClick={() => onSelect(factor)}
    >
      {factor}x{experimental && <span className="badge">Experimental</span>}
    </button>
  );
}
```

## Naming Conventions

- **Files:** kebab-case (`upscaler.ts`, `factor-button.tsx`)
- **Components:** PascalCase (`FactorButton`)
- **Functions/variables:** camelCase (`upscaleImage`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FACTOR`)
- **Output files:** original name + factor suffix (`photo_4x.png`)
