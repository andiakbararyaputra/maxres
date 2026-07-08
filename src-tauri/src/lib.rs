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

/// Never overwrite a user's file: if `desired` exists, return
/// "name (2).png", "name (3).png", … — the first free name.
#[tauri::command]
fn unique_output_path(desired: String) -> String {
    let path = std::path::Path::new(&desired);
    if !path.exists() {
        return desired;
    }
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("upscaled");
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("png");
    let parent = path.parent().unwrap_or_else(|| std::path::Path::new(""));
    for n in 2..10_000u32 {
        let candidate = parent.join(format!("{stem} ({n}).{ext}"));
        if !candidate.exists() {
            return candidate.to_string_lossy().into_owned();
        }
    }
    desired // practically unreachable
}

/// True if a file exists at `path`. Used to confirm the engine actually
/// produced its output (it can exit 0 on a bad image without writing one).
#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).is_file()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            halve_image,
            remove_temp_file,
            unique_output_path,
            file_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unique_path_returns_desired_when_free() {
        let dir = std::env::temp_dir().join("maxres-test-free");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let desired = dir.join("photo_4x.png").to_string_lossy().into_owned();
        assert_eq!(unique_output_path(desired.clone()), desired);
    }

    #[test]
    fn unique_path_appends_counter_when_taken() {
        let dir = std::env::temp_dir().join("maxres-test-taken");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let desired = dir.join("photo_4x.png");
        std::fs::write(&desired, b"x").unwrap();
        let got = unique_output_path(desired.to_string_lossy().into_owned());
        assert!(got.ends_with("photo_4x (2).png"), "got: {got}");
        // And if (2) is also taken, we get (3).
        std::fs::write(&got, b"x").unwrap();
        let got3 = unique_output_path(desired.to_string_lossy().into_owned());
        assert!(got3.ends_with("photo_4x (3).png"), "got: {got3}");
    }
}
