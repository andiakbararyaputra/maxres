/*
 * Upscaler orchestration — the ONLY place that talks to the AI engine.
 * Components never spawn processes (agent_docs/code_patterns.md).
 *
 * Executes the steps from planUpscale (see plan.ts): native 4x engine
 * passes chained through temp files, plus "halve" resizes done by the
 * app's small Rust helper. The engine's own -s flag is BROKEN for
 * non-4x values (corrupted output) and must never be used.
 *
 * Every run resolves to a typed result — no exceptions reach the UI,
 * no silent failures (PRD quality standard).
 */

import { Command, type Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { resolveResource, tempDir, join } from "@tauri-apps/api/path";
import { deriveOutputPath } from "./files";
import { planUpscale } from "./plan";
import type { Factor } from "./app-state";

export type UpscaleResult =
  | { ok: true; outputPath: string }
  | {
      ok: false;
      reason:
        "engine-failed" | "out-of-memory" | "cancelled" | "engine-unavailable";
      message: string;
    };

/** Handle returned to the UI so a running job can be cancelled. */
export type UpscaleJob = {
  /** Resolves when the job finishes, fails, or is cancelled. */
  result: Promise<UpscaleResult>;
  /** Stops the engine and abandons the job. */
  cancel: () => Promise<void>;
};

const MODEL_NAME = "realesrgan-x4plus";

/**
 * Start upscaling `inputPath` by `factor`. Returns immediately with a job
 * handle; progress arrives via `onProgress` (0-100 across ALL steps).
 */
export function startUpscale(
  inputPath: string,
  factor: Factor,
  onProgress: (percent: number) => void,
): UpscaleJob {
  let child: Child | null = null;
  let cancelled = false;

  const result = run();
  return {
    result,
    cancel: async () => {
      cancelled = true;
      if (child) {
        try {
          await child.kill();
        } catch {
          // Process may have already exited between check and kill — fine.
        }
      }
    },
  };

  async function run(): Promise<UpscaleResult> {
    const steps = planUpscale(factor);
    const tempFiles: string[] = [];

    try {
      // Never overwrite: if photo_4x.png exists, Rust returns "photo_4x (2).png".
      const finalOutput = await invoke<string>("unique_output_path", {
        desired: deriveOutputPath(inputPath, factor),
      });
      const modelsDir = await resolveResource("models");
      const tmp = await tempDir();

      let currentInput = inputPath;

      for (let i = 0; i < steps.length; i++) {
        if (cancelled) {
          return {
            ok: false,
            reason: "cancelled",
            message: "Upscaling cancelled.",
          };
        }

        const step = steps[i];
        const isLast = i === steps.length - 1;
        // Intermediate results live in the OS temp dir; only the final
        // step writes next to the user's original.
        const stepOutput = isLast
          ? finalOutput
          : await join(tmp, `maxres-${Date.now()}-step${i}.png`);
        if (!isLast) tempFiles.push(stepOutput);

        if (step.kind === "engine") {
          const passResult = await runEnginePass(
            currentInput,
            stepOutput,
            modelsDir,
            (enginePct) =>
              onProgress(
                Math.round(
                  step.progressFrom +
                    (enginePct / 100) * (step.progressTo - step.progressFrom),
                ),
              ),
          );
          if (!passResult.ok) return passResult;
        } else {
          // Plain high-quality shrink via the app's Rust helper (not AI).
          await invoke("halve_image", {
            input: currentInput,
            output: stepOutput,
            halvings: step.halvings,
          });
          onProgress(step.progressAt);
        }

        currentInput = stepOutput;
      }

      if (cancelled) {
        return {
          ok: false,
          reason: "cancelled",
          message: "Upscaling cancelled.",
        };
      }
      return { ok: true, outputPath: finalOutput };
    } catch (err: unknown) {
      console.error("upscale job failed:", err);
      if (cancelled) {
        return {
          ok: false,
          reason: "cancelled",
          message: "Upscaling cancelled.",
        };
      }
      return {
        ok: false,
        reason: "engine-unavailable",
        message: `The upscaler couldn't run. Details: ${String(err)}`,
      };
    } finally {
      // Always clean up intermediates — success, failure, or cancel.
      // remove_temp_file refuses paths outside the temp dir by design.
      for (const file of tempFiles) {
        invoke("remove_temp_file", { path: file }).catch(() => {
          /* already gone or engine never created it — fine */
        });
      }
    }
  }

  /** One native 4x engine pass: input file → output file. */
  async function runEnginePass(
    input: string,
    output: string,
    modelsDir: string,
    onPassProgress: (percent: number) => void,
  ): Promise<UpscaleResult> {
    // Paths passed as ARGUMENTS, never interpolated into a shell string
    // (injection safety — AGENTS.md "What NOT To Do").
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

    // The engine reports progress on stderr as lines like "25.00%".
    // It can also print "decode image ... failed" and STILL exit 0, so we
    // watch for that and verify the output file afterwards.
    let decodeFailed = false;
    command.stderr.on("data", (line: string) => {
      if (line.includes("decode image") && line.includes("failed")) {
        decodeFailed = true;
      }
      const match = line.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        onPassProgress(Math.min(100, Math.round(parseFloat(match[1]))));
      }
    });

    return new Promise<UpscaleResult>((resolve) => {
      command.on("close", (payload: { code: number | null }) => {
        child = null;
        if (cancelled) {
          resolve({
            ok: false,
            reason: "cancelled",
            message: "Upscaling cancelled.",
          });
          return;
        }
        // Trust nothing: the engine can exit 0 without producing a file.
        void (async () => {
          const produced = await invoke<boolean>("file_exists", {
            path: output,
          });
          if (payload.code === 0 && !decodeFailed && produced) {
            resolve({ ok: true, outputPath: output });
          } else {
            resolve({
              ok: false,
              reason: "engine-failed",
              message:
                "The upscaler couldn't process this image. Is it a valid JPG, PNG, or WebP?",
            });
          }
        })();
      });

      command.on("error", (err: string) => {
        const oom =
          err.includes("vkAllocateMemory") || err.includes("out of memory");
        resolve({
          ok: false,
          reason: oom ? "out-of-memory" : "engine-failed",
          message: oom
            ? "Not enough memory for this size. Try a smaller factor."
            : `The upscaler failed. Details: ${err}`,
        });
      });

      command
        .spawn()
        .then((c) => {
          child = c;
          if (cancelled) void c.kill(); // cancelled during startup
        })
        .catch((err: unknown) => {
          // The engine never STARTED (missing sidecar, permission denied…).
          // Without this the UI would hang in "processing" forever.
          console.error("upscaler failed to start:", err);
          resolve({
            ok: false,
            reason: "engine-unavailable",
            message: `The upscaler couldn't start. Details: ${String(err)}`,
          });
        });
    });
  }
}
