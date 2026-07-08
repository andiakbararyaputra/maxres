import { describe, expect, it } from "vitest";
import { isSupportedImagePath } from "./files";

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
