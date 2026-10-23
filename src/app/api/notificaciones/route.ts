import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { getNotificaciones } from "@/src/lib/apertura";

export const dynamic = "force-dynamic";

/** Notificaciones del usuario de la sesion (cualquier rol). */
export async function GET() {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    return ok(await getNotificaciones(session.sub));
  } catch (error) {
    logger.error("GET /api/notificaciones", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron obtener las notificaciones.", 500);
  }
}
