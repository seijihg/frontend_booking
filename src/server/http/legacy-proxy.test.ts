import { describe, expect, it } from "vitest";

import {
  buildUpstreamUrl,
  pickRequestHeaders,
  pickResponseHeaders,
} from "./legacy-proxy";

const base = "http://localhost:8000/";

describe("buildUpstreamUrl", () => {
  it("appends exactly one trailing slash", () => {
    expect(buildUpstreamUrl(base, ["salons"], "").toString()).toBe(
      "http://localhost:8000/salons/"
    );
  });
  it("preserves the query string", () => {
    expect(
      buildUpstreamUrl(base, ["appointments"], "?date=2025-01-02").toString()
    ).toBe("http://localhost:8000/appointments/?date=2025-01-02");
  });
  it("handles multi-segment paths", () => {
    expect(buildUpstreamUrl(base, ["appointments", "12"], "").toString()).toBe(
      "http://localhost:8000/appointments/12/"
    );
  });
  it("rejects traversal and empty segments with 404", () => {
    expect(() => buildUpstreamUrl(base, ["..", "x"], "")).toThrow(
      expect.objectContaining({ status: 404 })
    );
    expect(() => buildUpstreamUrl(base, ["a", ""], "")).toThrow(
      expect.objectContaining({ status: 404 })
    );
  });
});

describe("pickRequestHeaders", () => {
  it("drops host and content-length, keeps allowed headers", () => {
    const out = pickRequestHeaders(
      new Headers({
        host: "localhost:3000",
        "content-length": "5",
        connection: "keep-alive",
        cookie: "token=abc",
        "content-type": "application/json",
      })
    );
    expect(out.get("host")).toBeNull();
    expect(out.get("content-length")).toBeNull();
    expect(out.get("connection")).toBeNull();
    expect(out.get("cookie")).toBe("token=abc");
    expect(out.get("x-forwarded-host")).toBe("localhost:3000");
  });
});

describe("pickResponseHeaders", () => {
  it("forwards every set-cookie and drops content-encoding", () => {
    const upstream = new Headers({
      "content-type": "application/json",
      "content-encoding": "gzip",
      "content-length": "10",
    });
    upstream.append("set-cookie", "token=a; Path=/");
    upstream.append("set-cookie", "refresh_token=b; Path=/");
    const out = pickResponseHeaders(upstream);
    expect(out.getSetCookie()).toEqual([
      "token=a; Path=/",
      "refresh_token=b; Path=/",
    ]);
    expect(out.get("content-encoding")).toBeNull();
    expect(out.get("content-length")).toBeNull();
    expect(out.get("content-type")).toBe("application/json");
  });
});
