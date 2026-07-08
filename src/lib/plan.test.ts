import { describe, expect, it } from "vitest";
import { FACTORS } from "./app-state";
import { planUpscale, planScale } from "./plan";

describe("planUpscale", () => {
  it("every plan produces exactly its factor", () => {
    // The critical invariant: chained passes and halvings must multiply
    // out to the factor on the button the user clicked.
    for (const factor of FACTORS) {
      expect(planScale(planUpscale(factor))).toBe(factor);
    }
  });

  it("4x is a single native engine pass", () => {
    expect(planUpscale(4)).toEqual([
      { kind: "engine", progressFrom: 0, progressTo: 100 },
    ]);
  });

  it("16x never uses the broken -s flag (engine passes only)", () => {
    const steps = planUpscale(16);
    expect(steps.every((s) => s.kind === "engine")).toBe(true);
    expect(steps).toHaveLength(2);
  });

  it("8x halves BEFORE the second pass (memory safety)", () => {
    const kinds = planUpscale(8).map((s) => s.kind);
    expect(kinds).toEqual(["engine", "halve", "engine"]);
  });

  it("progress ranges are monotonic and end at 100", () => {
    for (const factor of FACTORS) {
      const steps = planUpscale(factor);
      let last = 0;
      for (const step of steps) {
        if (step.kind === "engine") {
          expect(step.progressFrom).toBeGreaterThanOrEqual(last);
          expect(step.progressTo).toBeGreaterThan(step.progressFrom);
          last = step.progressTo;
        } else {
          expect(step.progressAt).toBeGreaterThanOrEqual(last);
          last = step.progressAt;
        }
      }
      expect(last).toBe(100);
    }
  });
});
