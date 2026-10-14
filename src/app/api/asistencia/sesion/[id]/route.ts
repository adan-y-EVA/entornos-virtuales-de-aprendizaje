import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import {
  ErrorAsistencia,
  getAsistenciaBySesion,
  bulkUpdateAsistencia,
} from "@/src/lib/asistencia";

export const dynamic = "force-dynamic";

function parsearId(id: string): number {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorAsistencia("Identificador de sesión inválido.");
  }
  return numero;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { id } = await params;
    const data = await getAsistenciaBySesion(parsearId(id), {
      ci: session.sub,
      role: session.role,
    });
    return ok(data);
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("GET /api/asistencia/sesion/[id]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cargar la sesión.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { id } = await params;
    const cuerpo = await request.json().catch(() => null);

    if (!cuerpo || !Array.isArray(cuerpo.asistencias)) {
      return fail("Se esperaba una lista de asistencias.", 400, {
        columna: "asistencias",
      });
    }

    const actualizados = await bulkUpdateAsistencia(
      parsearId(id),
      cuerpo.asistencias,
      { ci: session.sub, role: session.role },
    );

    return ok({ actualizados });
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("PATCH /api/asistencia/sesion/[id]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo guardar la asistencia.", 500);
  }
}
