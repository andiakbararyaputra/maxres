/*
 * Upscaler orchestration — the ONLY place that talks to the AI engine.
 * Components never spawn processes (agent_docs/code_patterns.md).
 *
 * The bundled engine (realesrgan-ncnn-vulkan) natively upscales 4x.
 * Phase 2 wires that native pass; 2x/8x/16x chaining arrives in Phase 3.
 *
 * Every run returns a typed result — no exceptions reach the UI,
 * no silent failures (PRD quality standard).
 */

import { Command } from "@tauri-apps/plugin-shell";
import { resolveResource } from "@tauri-apps/api/path";
import { deriveOutputPath } from "./files";
import type { Factor } from "./app-state";

export type UpscaleResult =
  | { ok: true; outputPath: string }
  | {
      ok: false;
      reason:
        | "engine-failed"
        | "out-of-memory"
        | "unsupported-factor"
        | "engine-unavailable";
      message: string;
    };

const MODEL_NAME = "realesrgan-x4plus";

/** Upscale `inputPath` by `factor`, saving next to the original. */
export async function upscale(
  inputPath: string,
  factor: Factor,
): Promise<UpscaleResult> {
  if (factor !== 4) {
    // Buttons for other factors are disabled until Phase 3; this guard
    // makes the contract explicit rather than silently doing the wrong thing.
    return {
      ok: false,
      reason: "unsupported-factor",
      message: "Only 4x is available in this build step.",
    };
  }
  const outputPath = deriveOutputPath(inputPath, factor);
  try {
    return await runEnginePass(inputPath, outputPath);
  } catch (err: unknown) {
    // The engine never STARTED (missing sidecar, permission denied, bad
    // resource path…). Without this catch the UI would hang in
    // "processing" forever — every failure must land in a visible state.
    console.error("upscaler failed to start:", err);
    return {
      ok: false,
      reason: "engine-unavailable",
      message: `The upscaler couldn't start. Details: ${String(err)}`,
    };
  }
}

/** One native 4x engine pass: input file → output file. */
async function runEnginePass(
  input: string,
  output: string,
): Promise<UpscaleResult> {
  // The AI model weights ship as bundled resources; resolve their real
  // location at runtime (works in both `tauri dev` and installed builds).
  const modelsDir = await resolveResource("models");

  // Paths are passed as ARGUMENTS — never interpolated into a shell string
  // (injection safety, see AGENTS.md "What NOT To Do").
  const command = Command.sidecar("binaries/upscaler", [
    "-i",
    input,
    "-o",
    output,
    "-n",
    MODEL_NAME,
    "-m",
    modelsDir,
  ]);

  const result = await command.execute();

  if (result.code !== 0) {
    const stderr = result.stderr ?? "";
    console.error("engine exited non-zero:", result.code, stderr.slice(-500));
    const outOfMemory =
      stderr.includes("vkAllocateMemory") || stderr.includes("out of memory");
    return {
      ok: false,
      reason: outOfMemory ? "out-of-memory" : "engine-failed",
      message: outOfMemory
        ? "Not enough memory for this photo. Try a smaller image."
        : "The upscaler couldn't process this image. Is it a valid JPG, PNG, or WebP?",
    };
  }

  return { ok: true, outputPath: output };
}
