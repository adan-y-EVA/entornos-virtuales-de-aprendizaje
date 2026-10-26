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

export interface EstudianteCursoEstado {
  ci: string;
  nombres: string;
  apellidos: string;
  codigoSis: string;
  notaFinal: number | null;
  pctAsistencia: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  elegibleCertificado: boolean;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
}

export interface ResultadoNotas {
  guardados: number;
  restantes: number;
}

/** Evaluación parcial de un curso (Parcial 1, Trabajos, ...). */
export interface EvaluacionResumen {
  id: number;
  nombre: string;
  peso: number;
  orden: number;
  totalNotas: number;
}

export interface EstudianteNotas {
  ci: string;
  nombres: string;
  apellidos: string;
  codigoSis: string;
  pctAsistencia: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  elegibleCertificado: boolean;
  /** Nota por evaluación (idEvaluacion -> valor). Vacío en modo nota única. */
  notas: Record<number, number | null>;
  /** Nota final: promedio ponderado, o nota cargada en modo nota única. */
  promedio: number | null;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
}

export interface ResumenNotas {
  notaMinima: number;
  inscritos: number;
  conNota: number;
  sinNota: number;
  aprobados: number;
  reprobados: number;
  promedioGeneral: number | null;
}

/**
 * modo "evaluaciones": el promedio se calcula con los pesos.
 * modo "nota_unica": se carga una única nota final (modo legado).
 */
export interface DetalleNotasCurso {
  modo: 'evaluaciones' | 'nota_unica';
  evaluaciones: EvaluacionResumen[];
  estudiantes: EstudianteNotas[];
  resumen: ResumenNotas;
}

/** Evaluación definida por el estudiante en su progreso. */
export interface EvaluacionEstudiante {
  nombre: string;
  peso: number;
  nota: number | null;
}

export interface ProgresoCurso {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  fechaFin: string;
  instructor: string;
  /** Horas totales del curso. */
  duracionHoras: number;
  /** Horario agregado de las sesiones (ej. "08:00 - 10:00"). */
  horario: string | null;
  /** Estado del curso (ACTIVO / CERRADO). */
  estadoCurso: string;
  totalSesiones: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  pctAsistencia: number;
  elegibleCertificado: boolean;
  notaFinal: number | null;
  /** Desglose de notas por evaluación (vacío si el curso no define evaluaciones). */
  evaluaciones: EvaluacionEstudiante[];
  /** Nota mínima para aprobar, configurable por curso. */
  notaMinima: number;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
  /** Fecha de emisión del certificado, si existe. */
  fechaEmision: string | null;
}

/** Formatea una fecha ISO (YYYY-MM-DD) sin corrimiento por zona horaria. */
export function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
