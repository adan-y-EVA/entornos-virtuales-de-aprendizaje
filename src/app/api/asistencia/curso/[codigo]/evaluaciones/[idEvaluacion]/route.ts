import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia } from "@/src/lib/asistencia";
import { ErrorNotas, actualizarEvaluacion, eliminarEvaluacion } from "@/src/lib/notas";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ codigo: string; idEvaluacion: string }> };

function parsearId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorNotas("Identificador de evaluación inválido.");
  }
  return id;
}

/** Actualiza el nombre y/o el peso de una evaluación. */
export async function PATCH(request: NextRequest, { params }: Contexto) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo, idEvaluacion } = await params;
    const cuerpo = await request.json().catch(() => null);
    if (!cuerpo) return fail("Cuerpo inválido.", 400);

    const evaluacion = await actualizarEvaluacion(
      codigo,
      parsearId(idEvaluacion),
      cuerpo,
      { ci: session.sub, role: session.role },
    );

    return ok(evaluacion);
  } catch (error) {
    if (error instanceof ErrorNotas || error instanceof ErrorAsistencia) {
      return fail(error.message, 400);
    }
    logger.error("PATCH /api/asistencia/curso/[codigo]/evaluaciones/[idEvaluacion]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo actualizar la evaluación.", 500);
  }
}

/** Elimina la evaluación y sus notas. Los promedios se recalculan. */
export async function DELETE(request: NextRequest, { params }: Contexto) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo, idEvaluacion } = await params;

    const resultado = await eliminarEvaluacion(codigo, parsearId(idEvaluacion), {
      ci: session.sub,
      role: session.role,
    });

    return ok(resultado);
  } catch (error) {
    if (error instanceof ErrorNotas || error instanceof ErrorAsistencia) {
      return fail(error.message, 400);
    }
    logger.error("DELETE /api/asistencia/curso/[codigo]/evaluaciones/[idEvaluacion]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo eliminar la evaluación.", 500);
  }
}
