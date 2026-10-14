import type { EstadoAsistencia } from "@/generated/prisma/enums";

export type { EstadoAsistencia };

export interface SesionResumen {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ambiente: string | null;
  total: number;
  presentes: number;
  ausentes: number;
  justificadas: number;
}

export interface CursoAsistencia {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  fechaFin: string;
  estado: string;
  numInscritos: number;
  sesiones: SesionResumen[];
}

export interface AsistenciaEstudiante {
  id: number | null;
  ciEstudiante: string;
  nombres: string;
  apellidos: string;
  codigoSis: string;
  estado: EstadoAsistencia;
}

export interface SesionDetalle {
  sesion: {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    ambiente: string | null;
    curso: {
      codigo: string;
      nombre: string;
      instructor: string;
    };
  };
  asistencias: AsistenciaEstudiante[];
}

export interface ProgresoCurso {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  fechaFin: string;
  instructor: string;
  totalSesiones: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  pctAsistencia: number;
  elegibleCertificado: boolean;
  notaFinal: number | null;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
}

/** Formatea una fecha ISO (YYYY-MM-DD) sin corrimiento por zona horaria. */
export function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
