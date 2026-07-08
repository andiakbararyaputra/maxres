/*
 * File validation — the boundary between "anything the OS hands us"
 * and "images MaxRes can process" (see agent_docs/code_patterns.md).
 * Pure logic: unit-testable without Tauri.
 */

/** Formats realesrgan-ncnn-vulkan reads reliably (see agent_docs/tech_stack.md). */
const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export function isSupportedImagePath(path: string): boolean {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = path.slice(dot + 1).toLowerCase();
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

/** User-facing message for rejected files — plain words, no jargon. */
export const UNSUPPORTED_FILE_MESSAGE =
  "That file type isn't supported. Please choose a JPG, PNG, or WebP image.";

/** Extension filter for the browse dialog. */
export const IMAGE_DIALOG_FILTER = {
  name: "Images",
  extensions: [...SUPPORTED_EXTENSIONS],
};
