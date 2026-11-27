import "server-only";
import type { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "object" && body !== null && "detail" in body
      ? String((body as { detail: unknown }).detail)
      : `ApiError ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const unauthorized = () =>
  new ApiError(401, { detail: "Authentication credentials were not provided." });

export const notFound = () => new ApiError(404, { detail: "Not found." });

export const forbidden = () =>
  new ApiError(403, {
    detail: "You do not have permission to perform this action.",
  });

/** Maps zod issues to the DRF shape `{ "<field>": ["message"] }`. */
export function zodToFieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "non_field_errors";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
