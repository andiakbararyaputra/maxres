/*
 * FactorPicker — the 2x / 4x / 8x / 16x buttons.
 * Phase 1: visual only (disabled) — the AI engine arrives in Phase 2,
 * and clicking will start an upscale in Phase 3.
 */

import { FACTORS, EXPERIMENTAL_FACTOR, type Factor } from "../lib/app-state";

type FactorPickerProps = {
  /** Buttons stay disabled until upscaling is implemented (Phase 3). */
  disabled: boolean;
  onSelect: (factor: Factor) => void;
};

export function FactorPicker({ disabled, onSelect }: FactorPickerProps) {
  return (
    <div className="factor-picker" role="group" aria-label="Upscale factor">
      {FACTORS.map((factor) => (
        <button
          key={factor}
          type="button"
          className="factor-btn"
          disabled={disabled}
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
