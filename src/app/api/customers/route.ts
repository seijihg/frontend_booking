import { customerCreateSchema, customerListQuerySchema } from "@/lib/validation/customer";
import { requireSession } from "@/server/auth/session";
import { handle, json } from "@/server/http/respond";
import { createCustomer, listCustomers } from "@/server/services/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const { user } = await requireSession();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = customerListQuerySchema.parse(params);
  return json(await listCustomers(user, query));
});

export const POST = handle(async (req: Request) => {
  const { user } = await requireSession();
  const raw: unknown = await req.json().catch(() => ({}));
  const input = customerCreateSchema.parse(raw);
  return json(await createCustomer(user, input), { status: 201 });
});
