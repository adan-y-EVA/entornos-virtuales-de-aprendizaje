import { prisma } from "@/src/lib/prisma";
import { logger } from "@/src/lib/logger";
import { ok, fail } from "@/src/lib/api-response";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      totalCursos,
      preInscritos,
      totalEstudiantes,
      totalCertificados,
      ultimosCursos,
      ultimosCertificados
    ] = await Promise.all([
      prisma.curso.count({ where: { estado: 'activo' } }),
      prisma.inscripcion.count({ where: { estado: 'INSCRITO', estadoPago: 'PENDIENTE' } }),
      prisma.estudiante.count(),
      prisma.certificado.count(),
      prisma.curso.findMany({
        take: 5,
        orderBy: { fechaIni: 'desc' },
        include: { instructor: { include: { usuario: true } } }
      }),
      prisma.certificado.findMany({
        take: 5,
        orderBy: { fechaEmision: 'desc' }
      })
    ]);

    const cursosFormateados = ultimosCursos.map(c => ({
      codigo: c.codigo,
      nombre: c.nombre,
      duracionHoras: c.duracionHoras,
      fechaIni: c.fechaIni,
      fechaFin: c.fechaFin,
      instructor: `${c.instructor.usuario?.nombres || ''} ${c.instructor.usuario?.apellidos || ''}`.trim(),
      numInscritos: c.numInscritos,
      estado: c.estado
    }));

    return ok({
      estadisticas: {
        activos: totalCursos,
        preInscritos: preInscritos,
        alumnos: totalEstudiantes,
        certificados: totalCertificados,
      },
      cursos: cursosFormateados,
      certificados: ultimosCertificados
    });
  } catch (error) {
    logger.error("GET /api/dashboard", { error: error instanceof Error ? error.message : String(error) });
    return fail("Error interno", 500);
  }
}
