import type { NextRequest } from "next/server";

import { ApiError } from "@/server/http/errors";
import { proxyToLegacy } from "@/server/http/legacy-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: Ctx) {
  const { path } = await params;
  try {
    return await proxyToLegacy(request, path);
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json(err.body, { status: err.status });
    }
    throw err;
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
