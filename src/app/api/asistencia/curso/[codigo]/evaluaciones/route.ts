import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { created, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia } from "@/src/lib/asistencia";
import { ErrorNotas, crearEvaluacion } from "@/src/lib/notas";

export const dynamic = "force-dynamic";

/** Crea una evaluación (Parcial 1, Trabajos, ...) con su peso de ponderación. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const cuerpo = await request.json().catch(() => null);
    if (!cuerpo) return fail("Cuerpo inválido.", 400);

    const evaluacion = await crearEvaluacion(codigo, cuerpo, {
      ci: session.sub,
      role: session.role,
    });

    return created(evaluacion);
  } catch (error) {
    if (error instanceof ErrorNotas || error instanceof ErrorAsistencia) {
      return fail(error.message, 400);
    }
    logger.error("POST /api/asistencia/curso/[codigo]/evaluaciones", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo crear la evaluación.", 500);
  }
}
