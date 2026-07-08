/*
 * DropZone — the single entry point of the app.
 * Phase 1: renders the zone and shows the selected file.
 * The actual drag/drop + browse wiring lives in App.tsx (Phase 1 step 5),
 * because Tauri delivers drop events at the window level, not per-element.
 */

type DropZoneProps = {
  /** Path of the currently selected file, or null when idle. */
  filePath: string | null;
  /** True while the user is dragging a file over the window. */
  isDragActive: boolean;
  /** Called when the user clicks the zone (opens the file picker). */
  onBrowse: () => void;
};

/** Shows just the file name from a full path, so Maria isn't shown `/home/...` noise first. */
function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

export function DropZone({ filePath, isDragActive, onBrowse }: DropZoneProps) {
  return (
    <button
      type="button"
      className={`drop-zone${isDragActive ? " drop-zone--active" : ""}`}
      onClick={onBrowse}
      aria-label="Drop an image to upscale, or click to browse"
    >
      {filePath === null ? (
        <>
          <span className="drop-zone__icon" aria-hidden="true">
            ⇣
          </span>
          <span className="drop-zone__title">Drop an image to upscale</span>
          <span className="drop-zone__hint">or click to browse</span>
        </>
      ) : (
        <>
          <span
            className="drop-zone__icon drop-zone__icon--ready"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="drop-zone__title">{fileName(filePath)}</span>
          <span className="drop-zone__hint drop-zone__path">{filePath}</span>
        </>
      )}
    </button>
  );
}
