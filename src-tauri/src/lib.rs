// MaxRes native helpers.
// These are NOT AI code — the AI lives in the bundled sidecar engine.
// They exist because the engine only natively upscales 4x, so 2x/8x are
// derived by shrinking (plain math). Doing the shrink here avoids granting
// the UI broad file-system permissions and avoids giant browser canvases.

use std::path::PathBuf;

/// Shrink an image to 1/(2^halvings) of its size and save as PNG.
/// Example: a 4x engine result halved once becomes a 2x result.
#[tauri::command]
async fn halve_image(input: String, output: String, halvings: u32) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let img = image::open(&input).map_err(|e| format!("couldn't open image: {e}"))?;
        let div = 2u32.pow(halvings.clamp(1, 4));
        let (nw, nh) = ((img.width() / div).max(1), (img.height() / div).max(1));
        // Lanczos3 = high-quality resampling filter (no AI, just good math).
        let resized = img.resize_exact(nw, nh, image::imageops::FilterType::Lanczos3);
        resized
            .save(&output)
            .map_err(|e| format!("couldn't save image: {e}"))
    })
    .await
    .map_err(|e| format!("resize task failed: {e}"))?
}

/// Delete a file, but ONLY inside the OS temp directory — safe by
/// construction: it is impossible to delete user files with this command.
#[tauri::command]
fn remove_temp_file(path: String) -> Result<(), String> {
    let requested = PathBuf::from(&path)
        .canonicalize()
        .map_err(|e| format!("bad path: {e}"))?;
    let temp_dir = std::env::temp_dir()
        .canonicalize()
        .map_err(|e| format!("no temp dir: {e}"))?;
    if !requested.starts_with(&temp_dir) {
        return Err("refusing to delete a file outside the temp directory".into());
    }
    std::fs::remove_file(&requested).map_err(|e| format!("couldn't delete: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![halve_image, remove_temp_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
