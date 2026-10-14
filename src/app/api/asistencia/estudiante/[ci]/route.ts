import { type NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized, forbidden, notFound } from "@/src/lib/api-response";
import { ErrorAsistencia, getProgresoEstudiante } from "@/src/lib/asistencia";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ci: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { ci } = await params;

    if (session.role === "INSTRUCTOR") {
      const vinculado = await prisma.inscripcion.findFirst({
        where: {
          ciEstudiante: ci,
          estado: "INSCRITO",
          curso: { ciInstructor: session.sub },
        },
        select: { ciEstudiante: true },
      });
      if (!vinculado) return forbidden("No tienes permiso sobre este estudiante.");
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { ci },
      include: { usuario: { select: { nombres: true, apellidos: true } } },
    });
    if (!estudiante) return notFound("El estudiante no existe.");

    const progreso = await getProgresoEstudiante(ci);

    return ok({
      estudiante: {
        ci: estudiante.ci,
        nombres: estudiante.usuario.nombres,
        apellidos: estudiante.usuario.apellidos,
        codigoSis: estudiante.codigoSis,
      },
      cursos: progreso,
    });
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("GET /api/asistencia/estudiante/[ci]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cargar el estudiante.", 500);
  }
}
