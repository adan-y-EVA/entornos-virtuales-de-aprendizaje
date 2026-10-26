import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia, guardarNotas } from "@/src/lib/asistencia";
import { ErrorNotas, getDetalleNotasCurso } from "@/src/lib/notas";

export const dynamic = "force-dynamic";

/** Detalle completo de notas: evaluaciones, notas por estudiante, promedios y resumen. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const detalle = await getDetalleNotasCurso(codigo, {
      ci: session.sub,
      role: session.role,
    });
    return ok(detalle);
  } catch (error) {
    if (error instanceof ErrorNotas || error instanceof ErrorAsistencia) {
      return fail(error.message, 400);
    }
    logger.error("GET /api/asistencia/curso/[codigo]/notas", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron cargar las notas del curso.", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const cuerpo = await request.json().catch(() => null);

    if (!cuerpo || !Array.isArray(cuerpo.notas)) {
      return fail("Se esperaba una lista de notas.", 400, {
        columna: "notas",
      });
    }

    const resultado = await guardarNotas(codigo, cuerpo.notas, {
      ci: session.sub,
      role: session.role,
    });

    return ok(resultado);
  } catch (error) {
    if (error instanceof ErrorAsistencia || error instanceof ErrorNotas) {
      return fail(error.message, 400);
    }
    logger.error("PUT /api/asistencia/curso/[codigo]/notas", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron guardar las notas.", 500);
  }
}
