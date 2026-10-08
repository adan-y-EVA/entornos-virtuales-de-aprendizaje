import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Ejecutamos las consultas en paralelo para mayor velocidad
    const [
      totalCursos, 
      totalEstudiantes, 
      totalCertificados, 
      ultimosCursos, 
      ultimosCertificados
    ] = await Promise.all([
      prisma.curso.count({ where: { estado: 'activo' } }),
      prisma.estudiante.count(),
      prisma.certificado.count(),
      // Traemos solo los 5 cursos más recientes
      prisma.curso.findMany({
        take: 5,
        orderBy: { fechaIni: 'desc' },
        include: { instructor: { include: { usuario: true } } }
      }),
      // Traemos los 5 certificados más recientes
      prisma.certificado.findMany({
        take: 5,
        orderBy: { fechaEmision: 'desc' }
      })
    ]);

    // Formateamos los cursos para aplanar el nombre del instructor
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

    return NextResponse.json({
      estadisticas: {
        activos: totalCursos,
        preInscritos: 0, // Puedes calcularlo sumando inscripciones si manejas ese estado
        alumnos: totalEstudiantes,
        certificados: totalCertificados,
      },
      cursos: cursosFormateados,
      certificados: ultimosCertificados
    });
  } catch (error) {
    console.error("Error cargando dashboard:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}