import "server-only";
import { ZodError } from "zod";

import { ApiError, zodToFieldErrors } from "./errors";

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/** Wraps a route handler, mapping thrown errors to DRF-shaped responses. */
export function handle<A extends unknown[]>(
  fn: (...args: A) => Promise<Response> | Response
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return json(err.body, { status: err.status });
      if (err instanceof ZodError) {
        return json(zodToFieldErrors(err), { status: 400 });
      }
      console.error(err);
      return json({ detail: "Internal server error." }, { status: 500 });
    }
  };
}
