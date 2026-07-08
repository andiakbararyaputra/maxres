/*
 * MaxRes — one screen, one job.
 * App.tsx owns the state machine and talks to Tauri (drag-drop events,
 * file dialog). Components below it just render state.
 * Phase 1 scope: select a file (drop or browse) and show its path.
 * The factor buttons become functional in Phase 3.
 */

import { useEffect, useReducer, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { DropZone } from "./components/drop-zone";
import { FactorPicker } from "./components/factor-picker";
import { initialState, reduce } from "./lib/app-state";
import {
  isSupportedImagePath,
  IMAGE_DIALOG_FILTER,
  UNSUPPORTED_FILE_MESSAGE,
} from "./lib/files";
import "./styles/tokens.css";
import "./App.css";

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
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [IMAGE_DIALOG_FILTER],
    });
    if (typeof picked === "string") selectFile(picked);
  }

  const filePath =
    state.status === "fileReady" || state.status === "processing"
      ? state.filePath
      : null;

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
          disabled
          onSelect={() => {
            /* Enabled in Phase 3 when the AI engine is wired up. */
          }}
        />
        <p className="factor-hint">
          Pick a size — the AI engine arrives in the next build step
        </p>
      </div>

      <p
        className={`status-line${
          state.status === "error" ? " status-line--error" : ""
        }`}
        role="status"
      >
        {state.status === "error" ? state.message : ""}
      </p>

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
