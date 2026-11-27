import "server-only";
import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { notFound } from "./errors";

const REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "cookie",
  "authorization",
  "user-agent",
];

const RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "location",
  "www-authenticate",
];

/** Django requires a trailing slash on every endpoint, so exactly one is appended. */
export function buildUpstreamUrl(
  base: string,
  segments: string[],
  search: string
): URL {
  if (
    segments.length === 0 ||
    segments.some((s) => s === "" || s.includes(".."))
  ) {
    throw notFound();
  }
  return new URL(`${base}${segments.join("/")}/${search}`);
}

export function pickRequestHeaders(headers: Headers): Headers {
  const out = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = headers.get(name);
    if (value !== null) out.set(name, value);
  }
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) out.set("x-forwarded-host", host);
  const proto = headers.get("x-forwarded-proto");
  if (proto) out.set("x-forwarded-proto", proto);
  return out;
}

export function pickResponseHeaders(upstream: Headers): Headers {
  const out = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.get(name);
    if (value !== null) out.set(name, value);
  }
  for (const cookie of upstream.getSetCookie()) {
    out.append("set-cookie", cookie);
  }
  return out;
}

export async function proxyToLegacy(
  request: NextRequest,
  segments: string[]
): Promise<Response> {
  const started = Date.now();
  const method = request.method;
  const url = buildUpstreamUrl(
    getEnv().LEGACY_API_URL,
    segments,
    request.nextUrl.search
  );
  const headers = pickRequestHeaders(request.headers);
  if (!headers.has("x-forwarded-proto")) {
    headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  }
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const log = (status: number) =>
    console.log(
      `[legacy-proxy] ${method} /${segments.join("/")}/ -> ${status} ${Date.now() - started}ms`
    );

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    log(upstream.status);
    // Response() rejects a body on 204/205/304 and HEAD; Django's DELETE returns 204.
    const nullBody =
      method === "HEAD" || [204, 205, 304].includes(upstream.status);
    return new Response(nullBody ? null : upstream.body, {
      status: upstream.status,
      headers: pickResponseHeaders(upstream.headers),
    });
  } catch (err) {
    console.error("[legacy-proxy] upstream failure", err);
    log(502);
    return Response.json({ detail: "Legacy API unavailable." }, { status: 502 });
  }
}
