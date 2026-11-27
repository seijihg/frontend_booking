import { describe, expect, it } from "vitest";

import { ApiError } from "@/server/http/errors";
import { MAX_AUDIO_SIZE, validateAudio } from "./transcribe";

const audio = (type: string, size = 4) =>
  new File([new Uint8Array(size)], "a.webm", { type });

function errorBody(fn: () => unknown): unknown {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    return (err as ApiError).body;
  }
  throw new Error("expected validateAudio to throw");
}

describe("validateAudio", () => {
  it("accepts a valid file and defaults language to en", () => {
    const f = audio("audio/webm");
    expect(validateAudio(f, undefined)).toEqual({ file: f, language: "en" });
  });

  it("keeps an explicit language", () => {
    expect(validateAudio(audio("audio/wav"), "vi").language).toBe("vi");
  });

  it("strips MIME parameters such as codecs", () => {
    expect(() => validateAudio(audio("audio/webm;codecs=opus"), undefined)).not.toThrow();
    expect(() => validateAudio(audio("audio/ogg; codecs=opus"), undefined)).not.toThrow();
  });

  it("rejects a missing file", () => {
    expect(errorBody(() => validateAudio(undefined, undefined))).toEqual({
      audio: ["No file was submitted."],
    });
    expect(errorBody(() => validateAudio("text", undefined))).toEqual({
      audio: ["No file was submitted."],
    });
  });

  it("rejects files over 10 MB and accepts exactly 10 MB", () => {
    expect(errorBody(() => validateAudio(audio("audio/webm", MAX_AUDIO_SIZE + 1), undefined))).toEqual({
      audio: ["File too large. Max size is 10 MB."],
    });
    expect(() => validateAudio(audio("audio/webm", MAX_AUDIO_SIZE), undefined)).not.toThrow();
  });

  it("rejects unsupported MIME types", () => {
    expect(errorBody(() => validateAudio(audio("video/mp4"), undefined))).toEqual({
      audio: ["Unsupported audio format: video/mp4. Allowed: mp3, mp4, wav, webm, ogg, m4a."],
    });
  });

  it("rejects a non-string language", () => {
    expect(errorBody(() => validateAudio(audio("audio/webm"), 5))).toEqual({
      language: ["Not a valid string."],
    });
  });
});
