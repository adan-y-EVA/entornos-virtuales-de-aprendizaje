import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { DIAS_AVISO_APERTURA, getCursosPorRevisar } from "@/src/lib/apertura";

export const dynamic = "force-dynamic";

/** Cursos PENDIENTE cerca de (o pasados de) su fecha limite de inscripcion. */
export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const diasTexto = request.nextUrl.searchParams.get("dias");
  const diasParam = diasTexto === null || diasTexto.trim() === "" ? NaN : Number(diasTexto);
  const dias = Number.isInteger(diasParam) && diasParam >= 0 ? diasParam : DIAS_AVISO_APERTURA;

  try {
    const cursos = await getCursosPorRevisar({ ci: session.sub, role: session.role }, dias);
    return ok(cursos);
  } catch (error) {
    logger.error("GET /api/cursos/por-revisar", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron obtener los cursos por revisar.", 500);
  }
}
