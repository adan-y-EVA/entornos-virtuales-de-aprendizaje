import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia } from "@/src/lib/asistencia";
import { ErrorNotas, guardarNotasEvaluacion } from "@/src/lib/notas";

export const dynamic = "force-dynamic";

/**
 * Guarda en lote las notas de una evaluación.
 * Body: `{ notas: [{ ci: string, valor: number | null }] }`
 * `valor: null` borra la nota de ese estudiante en esa evaluación.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string; idEvaluacion: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo, idEvaluacion } = await params;
    const id = Number(idEvaluacion);
    if (!Number.isInteger(id) || id <= 0) {
      return fail("Identificador de evaluación inválido.", 400);
    }

    const cuerpo = await request.json().catch(() => null);
    if (!cuerpo || !Array.isArray(cuerpo.notas)) {
      return fail("Se esperaba una lista de notas.", 400, { columna: "notas" });
    }

    const resultado = await guardarNotasEvaluacion(codigo, id, cuerpo.notas, {
      ci: session.sub,
      role: session.role,
    });

    return ok(resultado);
  } catch (error) {
    if (error instanceof ErrorNotas || error instanceof ErrorAsistencia) {
      return fail(error.message, 400);
    }
    logger.error("PUT /api/asistencia/curso/[codigo]/evaluaciones/[idEvaluacion]/notas", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron guardar las notas.", 500);
  }
}
