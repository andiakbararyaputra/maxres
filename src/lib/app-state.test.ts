import { describe, expect, it } from "vitest";
import { initialState, reduce, type AppState } from "./app-state";

const fileReady: AppState = { status: "fileReady", filePath: "/p/a.jpg" };
const processing: AppState = {
  status: "processing",
  filePath: "/p/a.jpg",
  factor: 4,
};

describe("app state machine", () => {
  it("idle → fileReady when a file is selected", () => {
    const next = reduce(initialState, {
      type: "FILE_SELECTED",
      filePath: "/p/a.jpg",
    });
    expect(next).toEqual(fileReady);
  });

  it("idle → error when a file is rejected", () => {
    const next = reduce(initialState, {
      type: "FILE_REJECTED",
      message: "nope",
    });
    expect(next).toEqual({ status: "error", message: "nope" });
  });

  it("fileReady → processing on START", () => {
    const next = reduce(fileReady, { type: "START", factor: 4 });
    expect(next).toEqual(processing);
  });

  it("START is ignored unless a file is ready (no phantom jobs)", () => {
    expect(reduce(initialState, { type: "START", factor: 2 })).toEqual(
      initialState,
    );
    expect(reduce(processing, { type: "START", factor: 8 })).toEqual(
      processing,
    );
  });

  it("selecting a new file is ignored while processing", () => {
    const next = reduce(processing, {
      type: "FILE_SELECTED",
      filePath: "/p/b.png",
    });
    expect(next).toEqual(processing);
  });

  it("processing → done on SUCCESS", () => {
    const next = reduce(processing, {
      type: "SUCCESS",
      outputPath: "/p/a_4x.png",
    });
    expect(next).toEqual({
      status: "done",
      filePath: "/p/a.jpg",
      outputPath: "/p/a_4x.png",
    });
  });

  it("processing → error on FAIL", () => {
    const next = reduce(processing, { type: "FAIL", message: "engine died" });
    expect(next).toEqual({ status: "error", message: "engine died" });
  });

  it("SUCCESS/FAIL are ignored outside processing", () => {
    expect(reduce(fileReady, { type: "SUCCESS", outputPath: "/x" })).toEqual(
      fileReady,
    );
    expect(reduce(initialState, { type: "FAIL", message: "?" })).toEqual(
      initialState,
    );
  });

  it("RESET returns to idle from anywhere", () => {
    expect(reduce(processing, { type: "RESET" })).toEqual(initialState);
    expect(
      reduce({ status: "error", message: "x" }, { type: "RESET" }),
    ).toEqual(initialState);
  });

  it("selecting a replacement file from fileReady swaps the file", () => {
    const next = reduce(fileReady, {
      type: "FILE_SELECTED",
      filePath: "/p/b.png",
    });
    expect(next).toEqual({ status: "fileReady", filePath: "/p/b.png" });
  });
});
