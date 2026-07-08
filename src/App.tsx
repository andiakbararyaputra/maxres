/*
 * MaxRes — one screen, one job.
 * App.tsx owns the state machine and talks to Tauri (drag-drop events,
 * file dialog). Components below it just render state.
 * Phase 2 scope: the engine-native 4x pass runs end-to-end.
 * 2x/8x/16x chaining arrives in Phase 3.
 */

import { useEffect, useReducer, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { DropZone } from "./components/drop-zone";
import { FactorPicker } from "./components/factor-picker";
import { initialState, reduce, type Factor } from "./lib/app-state";
import {
  isSupportedImagePath,
  IMAGE_DIALOG_FILTER,
  UNSUPPORTED_FILE_MESSAGE,
} from "./lib/files";
import { upscale } from "./lib/upscaler";
import "./styles/tokens.css";
import "./App.css";

/** Phase 2: only the engine-native 4x is live. Phase 3 unlocks the rest. */
const AVAILABLE_FACTORS: readonly Factor[] = [4];

function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

function App() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [isDragActive, setIsDragActive] = useState(false);

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

  /** fileReady + factor click → run the engine → done or error. */
  async function startUpscale(factor: Factor) {
    if (state.status !== "fileReady") return;
    const inputPath = state.filePath;
    dispatch({ type: "START", factor });
    const result = await upscale(inputPath, factor);
    if (result.ok) {
      dispatch({ type: "SUCCESS", outputPath: result.outputPath });
    } else {
      dispatch({ type: "FAIL", message: result.message });
    }
  }

  const filePath =
    state.status === "fileReady" ||
    state.status === "processing" ||
    state.status === "done"
      ? state.filePath
      : null;

  const enabledFactors = state.status === "fileReady" ? AVAILABLE_FACTORS : [];

  const factorHint =
    state.status === "idle"
      ? "Drop a photo to choose a size"
      : "4x is ready — more sizes arrive in the next build step";

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
        <FactorPicker enabledFactors={enabledFactors} onSelect={startUpscale} />
        {(state.status === "idle" || state.status === "fileReady") && (
          <p className="factor-hint">{factorHint}</p>
        )}
      </div>

      <div className="status-line" role="status">
        {state.status === "processing" && (
          <span>Upscaling {state.factor}x… big photos can take a minute</span>
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
