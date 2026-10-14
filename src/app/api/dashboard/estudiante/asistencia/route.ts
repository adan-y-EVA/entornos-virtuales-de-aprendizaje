import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia, getProgresoEstudiante } from "@/src/lib/asistencia";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session) return unauthorized();
  if (session.role !== "ESTUDIANTE") return fail("No autorizado.", 403);

  try {
    const progreso = await getProgresoEstudiante(session.sub);
    return ok(progreso);
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("GET /api/dashboard/estudiante/asistencia", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cargar tu progreso.", 500);
  }
}
