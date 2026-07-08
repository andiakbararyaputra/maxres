/*
 * The MaxRes UI state machine (AGENTS.md convention):
 *   idle → fileReady → processing → done | error
 * One explicit machine instead of scattered booleans, so the UI can
 * never show contradictory states (e.g. "processing" with no file).
 */

export const FACTORS = [2, 4, 8, 16] as const;
export type Factor = (typeof FACTORS)[number];

/** 16x is large (16× each side = 256× pixels) and can exhaust memory on older machines. */
export const EXPERIMENTAL_FACTOR: Factor = 16;

export type AppState =
  | { status: "idle" }
  | { status: "fileReady"; filePath: string }
  | { status: "processing"; filePath: string; factor: Factor; progress: number }
  | { status: "done"; filePath: string; outputPath: string }
  | { status: "error"; message: string };

export type AppEvent =
  | { type: "FILE_SELECTED"; filePath: string }
  | { type: "FILE_REJECTED"; message: string }
  | { type: "START"; factor: Factor }
  | { type: "PROGRESS"; progress: number }
  | { type: "SUCCESS"; outputPath: string }
  | { type: "FAIL"; message: string }
  | { type: "RESET" };

export const initialState: AppState = { status: "idle" };

/**
 * Pure transition function: given the current state and an event,
 * return the next state. Invalid transitions return the state
 * unchanged, which makes impossible UI flows literally impossible.
 */
export function reduce(state: AppState, event: AppEvent): AppState {
  switch (event.type) {
    case "FILE_SELECTED":
      // Allowed whenever we're not mid-job: idle, fileReady (replace file),
      // done or error (start over with a new file).
      if (state.status === "processing") return state;
      return { status: "fileReady", filePath: event.filePath };

    case "FILE_REJECTED":
      if (state.status === "processing") return state;
      return { status: "error", message: event.message };

    case "START":
      if (state.status !== "fileReady") return state;
      return {
        status: "processing",
        filePath: state.filePath,
        factor: event.factor,
        progress: 0,
      };

    case "PROGRESS":
      // Only meaningful mid-job; ignored otherwise. Never goes backwards.
      if (state.status !== "processing") return state;
      return { ...state, progress: Math.max(state.progress, event.progress) };

    case "SUCCESS":
      if (state.status !== "processing") return state;
      return {
        status: "done",
        filePath: state.filePath,
        outputPath: event.outputPath,
      };

    case "FAIL":
      if (state.status !== "processing") return state;
      return { status: "error", message: event.message };

    case "RESET":
      return initialState;
  }
}
