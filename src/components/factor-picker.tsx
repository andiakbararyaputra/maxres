/*
 * FactorPicker — the 2x / 4x / 8x / 16x buttons.
 * Buttons enable per-factor: Phase 2 enables the engine-native 4x;
 * 2x/8x/16x follow in Phase 3 with pass-chaining.
 */

import { FACTORS, EXPERIMENTAL_FACTOR, type Factor } from "../lib/app-state";

type FactorPickerProps = {
  /** Factors that may be clicked right now (empty while idle/processing). */
  enabledFactors: readonly Factor[];
  onSelect: (factor: Factor) => void;
};

export function FactorPicker({ enabledFactors, onSelect }: FactorPickerProps) {
  return (
    <div className="factor-picker" role="group" aria-label="Upscale factor">
      {FACTORS.map((factor) => (
        <button
          key={factor}
          type="button"
          className="factor-btn"
          disabled={!enabledFactors.includes(factor)}
          onClick={() => onSelect(factor)}
          aria-label={`Upscale ${factor} times${
            factor === EXPERIMENTAL_FACTOR ? " (experimental)" : ""
          }`}
        >
          {factor}x
          {factor === EXPERIMENTAL_FACTOR && (
            <span className="factor-btn__badge">Experimental</span>
          )}
        </button>
      ))}
    </div>
  );
}
