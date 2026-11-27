import { salonCreateSchema } from "@/lib/validation/salon";
import { requireSession } from "@/server/auth/session";
import { handle, json } from "@/server/http/respond";
import { createSalon, listSalons } from "@/server/services/salons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const { user } = await requireSession();
  return json(await listSalons(user));
});

export const POST = handle(async (req: Request) => {
  const { user } = await requireSession();
  const raw: unknown = await req.json().catch(() => ({}));
  const input = salonCreateSchema.parse(raw);
  return json(await createSalon(user, input), { status: 201 });
});
