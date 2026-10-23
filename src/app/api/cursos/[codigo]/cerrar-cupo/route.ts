import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorApertura, cerrarCursoPorCupo } from "@/src/lib/apertura";

export const dynamic = "force-dynamic";

const codigoCurso = z.string().trim().min(1).max(20);

const cuerpoSchema = z.object({
  codigoDestino: codigoCurso.nullable().optional(),
  reasignaciones: z.record(z.string().trim().min(1).max(10), codigoCurso.nullable()).optional(),
});

/** Cierra el curso por no alcanzar el minimo y reasigna o cancela a los inscritos. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = cuerpoSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail("Datos inválidos para cerrar el curso.", 400);
  }

  try {
    const { codigo } = await params;
    const resultado = await cerrarCursoPorCupo(
      codigo,
      { ci: session.sub, role: session.role },
      parsed.data,
    );
    return ok(resultado);
  } catch (error) {
    if (error instanceof ErrorApertura) return fail(error.message, 400);
    logger.error("POST /api/cursos/[codigo]/cerrar-cupo", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cerrar el curso.", 500);
  }
}
