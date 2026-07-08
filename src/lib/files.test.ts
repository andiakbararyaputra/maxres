import { describe, expect, it } from "vitest";
import { deriveOutputPath, isSupportedImagePath } from "./files";

describe("isSupportedImagePath", () => {
  it("accepts jpg, jpeg, png, webp", () => {
    expect(isSupportedImagePath("/home/maria/photo.jpg")).toBe(true);
    expect(isSupportedImagePath("/home/maria/photo.jpeg")).toBe(true);
    expect(isSupportedImagePath("/home/maria/photo.png")).toBe(true);
    expect(isSupportedImagePath("/home/maria/photo.webp")).toBe(true);
  });

  it("is case-insensitive (cameras often write .JPG)", () => {
    expect(isSupportedImagePath("/photos/IMG_0042.JPG")).toBe(true);
    expect(isSupportedImagePath("/photos/scan.PNG")).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(isSupportedImagePath("/docs/letter.pdf")).toBe(false);
    expect(isSupportedImagePath("/docs/notes.txt")).toBe(false);
    expect(isSupportedImagePath("/movies/clip.mp4")).toBe(false);
    expect(isSupportedImagePath("/images/anim.gif")).toBe(false);
  });

  it("rejects paths without an extension", () => {
    expect(isSupportedImagePath("/home/maria/photo")).toBe(false);
    expect(isSupportedImagePath("")).toBe(false);
  });

  it("handles dots and spaces in folder or file names", () => {
    expect(isSupportedImagePath("/my.photos/family trip.jpg")).toBe(true);
    expect(isSupportedImagePath("/my.photos/archive.v2/readme")).toBe(false);
  });
});

describe("deriveOutputPath", () => {
  it("replaces the extension with the factor suffix and .png", () => {
    expect(deriveOutputPath("/photos/mum.jpg", 4)).toBe("/photos/mum_4x.png");
    expect(deriveOutputPath("/photos/scan.png", 2)).toBe("/photos/scan_2x.png");
    expect(deriveOutputPath("/p/a.webp", 16)).toBe("/p/a_16x.png");
  });

  it("keeps the file next to the original (same folder)", () => {
    expect(deriveOutputPath("/home/maria/pics/dad.jpeg", 8)).toBe(
      "/home/maria/pics/dad_8x.png",
    );
  });

  it("is not confused by dots in folder names", () => {
    expect(deriveOutputPath("/my.photos/mum.jpg", 4)).toBe(
      "/my.photos/mum_4x.png",
    );
    // No extension on the file itself: suffix is appended, nothing stripped.
    expect(deriveOutputPath("/my.photos/mum", 4)).toBe("/my.photos/mum_4x.png");
  });

  it("handles spaces and unicode in names", () => {
    expect(deriveOutputPath("/pics/family trip été.jpg", 4)).toBe(
      "/pics/family trip été_4x.png",
    );
  });
});
