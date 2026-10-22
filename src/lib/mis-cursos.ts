import "server-only";
import { prisma } from "@/src/lib/prisma";
import type { Rol } from "@/src/lib/auth";
import { ErrorAsistencia } from "@/src/lib/asistencia";

interface Usuario {
  ci: string;
  role: Rol;
}

export interface CursoResumen {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  fechaFin: string;
  estado: string;
  numInscritos: number;
  notasPendientes: number;
  certificadosEmitidos: number;
  certificadosPendientes: number;
}

function soloFecha(valor: Date): string {
  return valor.toISOString().slice(0, 10);
}

/** Resumen de cursos del instructor (o todos si es ADMIN) con conteo de notas y certificados. */
export async function getMisCursosResumen(usuario: Usuario): Promise<CursoResumen[]> {
  const whereCurso = usuario.role === "ADMIN" ? {} : { ciInstructor: usuario.ci };

  const cursos = await prisma.curso.findMany({
    where: whereCurso,
    include: {
      inscripciones: {
        where: { estado: "INSCRITO" },
        select: { ciEstudiante: true },
      },
      certificados: {
        select: { ciEstudiante: true, tipo: true, notaFinal: true },
      },
    },
    orderBy: { fechaIni: "desc" },
  });

  return cursos.map((curso) => {
    const inscritos = curso.inscripciones;
    const conNota = new Set(
      curso.certificados
        .filter((c) => c.notaFinal != null)
        .map((c) => c.ciEstudiante),
    );
    const emitidos = curso.certificados.filter(
      (c) => c.tipo === "APROBADO" || c.tipo === "ASISTENCIA",
    ).length;
    const pendientes = curso.certificados.filter((c) => c.tipo === "PENDIENTE").length;

    return {
      codigo: curso.codigo,
      nombre: curso.nombre,
      grupo: curso.grupo,
      nivel: curso.nivel,
      fechaIni: soloFecha(curso.fechaIni),
      fechaFin: soloFecha(curso.fechaFin),
      estado: curso.estado,
      numInscritos: inscritos.length,
      notasPendientes: inscritos.filter((i) => !conNota.has(i.ciEstudiante)).length,
      certificadosEmitidos: emitidos,
      certificadosPendientes: pendientes,
    };
  });
}

export { ErrorAsistencia };
