/*
 * MaxRes — one screen, one job.
 * App.tsx owns the state machine and talks to Tauri (drag-drop events,
 * file dialog). Components below it just render state.
 * Phase 3: all four factors (2/4/8/16) run natively with live progress
 * and a cancel button; 16x asks for confirmation first (memory heads-up).
 */

import { useEffect, useReducer, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { DropZone } from "./components/drop-zone";
import { FactorPicker } from "./components/factor-picker";
import {
  initialState,
  reduce,
  EXPERIMENTAL_FACTOR,
  FACTORS,
  type Factor,
} from "./lib/app-state";
import {
  isSupportedImagePath,
  IMAGE_DIALOG_FILTER,
  UNSUPPORTED_FILE_MESSAGE,
} from "./lib/files";
import { startUpscale, type UpscaleJob } from "./lib/upscaler";
import "./styles/tokens.css";
import "./App.css";

function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

function App() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [isDragActive, setIsDragActive] = useState(false);
  // The running job handle, kept in a ref so the cancel button can reach it
  // without re-rendering on every progress tick.
  const jobRef = useRef<UpscaleJob | null>(null);

  /** Shared by drag-drop and browse: validate, then accept or reject. */
  function selectFile(path: string) {
    if (isSupportedImagePath(path)) {
      dispatch({ type: "FILE_SELECTED", filePath: path });
    } else {
      dispatch({ type: "FILE_REJECTED", message: UNSUPPORTED_FILE_MESSAGE });
    }
  }

  // Tauri delivers OS-level file drops as window events (not HTML5 drag&drop).
  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        setIsDragActive(true);
      } else if (event.payload.type === "drop") {
        setIsDragActive(false);
        const first = event.payload.paths[0];
        if (first !== undefined) selectFile(first);
      } else {
        // "leave" — drag cancelled
        setIsDragActive(false);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function browse() {
    if (state.status === "processing") return; // one job at a time
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [IMAGE_DIALOG_FILTER],
    });
    if (typeof picked === "string") selectFile(picked);
  }

  /** fileReady + factor click → (confirm 16x) → run engine → done/error. */
  async function onSelectFactor(factor: Factor) {
    if (state.status !== "fileReady") return;
    const inputPath = state.filePath;

    // 16x is large and slow; warn before committing (PRD requirement).
    if (factor === EXPERIMENTAL_FACTOR) {
      const proceed = await ask(
        "16x is experimental — it makes a very large image and can be slow or run out of memory on some machines. Continue?",
        { title: "Upscale 16x?", kind: "warning" },
      );
      if (!proceed) return;
    }

    dispatch({ type: "START", factor });
    const job = startUpscale(inputPath, factor, (percent) =>
      dispatch({ type: "PROGRESS", progress: percent }),
    );
    jobRef.current = job;

    const result = await job.result;
    jobRef.current = null;
    if (result.ok) {
      dispatch({ type: "SUCCESS", outputPath: result.outputPath });
    } else if (result.reason === "cancelled") {
      dispatch({ type: "RESET" });
    } else {
      dispatch({ type: "FAIL", message: result.message });
    }
  }

  async function cancel() {
    await jobRef.current?.cancel();
  }

  const filePath =
    state.status === "fileReady" ||
    state.status === "processing" ||
    state.status === "done"
      ? state.filePath
      : null;

  const enabledFactors = state.status === "fileReady" ? FACTORS : [];

  return (
    <main className="app">
      <h1 className="app__title">MaxRes</h1>
      <p className="app__subtitle">Make any photo print-ready</p>

      <DropZone
        filePath={filePath}
        isDragActive={isDragActive}
        onBrowse={browse}
      />

      <div>
        <FactorPicker
          enabledFactors={enabledFactors}
          onSelect={onSelectFactor}
        />
        {(state.status === "idle" || state.status === "fileReady") && (
          <p className="factor-hint">
            {state.status === "idle"
              ? "Drop a photo to choose a size"
              : "Pick a size — 4x is a great default"}
          </p>
        )}
      </div>

      <div className="status-line" role="status">
        {state.status === "processing" && (
          <div className="progress">
            <div className="progress__track">
              <div
                className="progress__bar"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <span className="progress__label">
              Upscaling {state.factor}x… {state.progress}%
            </span>
            <button type="button" className="btn-reset" onClick={cancel}>
              Cancel
            </button>
          </div>
        )}
        {state.status === "done" && (
          <>
            <span className="status-line--success">
              Saved as {fileName(state.outputPath)} next to your original
            </span>
            <button
              type="button"
              className="btn-reset"
              onClick={() => dispatch({ type: "RESET" })}
            >
              Upscale another
            </button>
          </>
        )}
        {state.status === "error" && (
          <span className="status-line--error">{state.message}</span>
        )}
      </div>

      <footer className="app__footer">
        <span className="app__footer-dot" aria-hidden="true">
          ●
        </span>
        100% offline — your photos never leave your device
      </footer>
    </main>
  );
}

export default App;
