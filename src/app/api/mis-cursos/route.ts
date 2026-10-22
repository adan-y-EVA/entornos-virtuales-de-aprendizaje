import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia, getMisCursosResumen } from "@/src/lib/mis-cursos";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const cursos = await getMisCursosResumen({ ci: session.sub, role: session.role });
    return ok(cursos);
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("GET /api/mis-cursos", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron cargar los cursos.", 500);
  }
}
