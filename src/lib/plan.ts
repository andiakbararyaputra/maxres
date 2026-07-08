/*
 * Upscale planning — pure logic, unit-tested, no Tauri imports.
 *
 * The engine only upscales 4x natively (its -s flag is BROKEN for other
 * values — produces corrupted output, verified 2026-07-08). All factors
 * are therefore built from native 4x passes plus plain "halve" resizes:
 *
 *   2x  = 4x engine pass, then halve once        (4 / 2  = 2)
 *   4x  = 4x engine pass                          (native)
 *   8x  = 4x pass, halve once (=2x), 4x pass      (2 * 4  = 8)
 *   16x = 4x pass, then 4x pass again             (4 * 4  = 16)
 *
 * 8x deliberately halves BEFORE the second pass so the largest image we
 * ever hold is 4x-sized (not 16x-sized) — kinder to low-RAM machines.
 */

import type { Factor } from "./app-state";

export type PlanStep =
  | {
      kind: "engine";
      /** Progress range this pass occupies (the engine reports 0-100 per pass). */
      progressFrom: number;
      progressTo: number;
    }
  | {
      kind: "halve";
      /** Number of times to halve (÷2 per halving). */
      halvings: number;
      /** Progress to report when the (fast) resize finishes. */
      progressAt: number;
    };

export function planUpscale(factor: Factor): PlanStep[] {
  switch (factor) {
    case 2:
      return [
        { kind: "engine", progressFrom: 0, progressTo: 95 },
        { kind: "halve", halvings: 1, progressAt: 100 },
      ];
    case 4:
      return [{ kind: "engine", progressFrom: 0, progressTo: 100 }];
    case 8:
      return [
        { kind: "engine", progressFrom: 0, progressTo: 48 },
        { kind: "halve", halvings: 1, progressAt: 52 },
        { kind: "engine", progressFrom: 52, progressTo: 100 },
      ];
    case 16:
      return [
        { kind: "engine", progressFrom: 0, progressTo: 50 },
        { kind: "engine", progressFrom: 50, progressTo: 100 },
      ];
  }
}

/** The overall scale multiplier a plan produces (for tests/sanity checks). */
export function planScale(steps: PlanStep[]): number {
  let scale = 1;
  for (const step of steps) {
    if (step.kind === "engine") scale *= 4;
    else scale /= 2 ** step.halvings;
  }
  return scale;
}
