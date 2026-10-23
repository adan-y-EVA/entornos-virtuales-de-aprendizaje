import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, notFound, unauthorized } from "@/src/lib/api-response";
import { marcarNotificacionLeida } from "@/src/lib/apertura";

export const dynamic = "force-dynamic";

/** Marca una notificacion propia como leida. */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return fail("Id inválido.", 400);

  try {
    const actualizada = await marcarNotificacionLeida(id, session.sub);
    if (!actualizada) return notFound("La notificación no existe.");
    return ok({ id, leida: true });
  } catch (error) {
    logger.error("PATCH /api/notificaciones/[id]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo actualizar la notificación.", 500);
  }
}
