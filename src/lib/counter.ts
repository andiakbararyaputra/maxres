/*
 * Local-only upscale counter (PRD success metric).
 * Stored in a small JSON file on the user's device via the store plugin —
 * never transmitted anywhere (there is no network permission to transmit
 * with). This is the privacy-friendly alternative to telemetry.
 */

import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("stats.json");
const KEY = "imagesUpscaled";

export async function getUpscaleCount(): Promise<number> {
  try {
    return (await store.get<number>(KEY)) ?? 0;
  } catch {
    return 0; // a broken stats file must never break the app
  }
}

export async function incrementUpscaleCount(): Promise<number> {
  try {
    const next = (await getUpscaleCount()) + 1;
    await store.set(KEY, next);
    await store.save();
    return next;
  } catch {
    return 0;
  }
}
