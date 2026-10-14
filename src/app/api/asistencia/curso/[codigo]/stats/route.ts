import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia, getEstudiantesCurso } from "@/src/lib/asistencia";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const estudiantes = await getEstudiantesCurso(codigo, {
      ci: session.sub,
      role: session.role,
    });
    return ok(estudiantes);
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("GET /api/asistencia/curso/[codigo]/stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cargar los estudiantes del curso.", 500);
  }
}
