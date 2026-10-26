import "server-only";
import { prisma } from "@/src/lib/prisma";
import type { Rol } from "@/src/lib/auth";
import type { EstadoAsistencia } from "@/generated/prisma/enums";

export type { EstadoAsistencia };

export const ESTADOS_ASISTENCIA: EstadoAsistencia[] = ["PRESENTE", "AUSENTE", "JUSTIFICADA"];

/** Duración por defecto de un curso: 10 sesiones (10 días). */
export const SESIONES_POR_CURSO = 10;

/** Más de 3 ausencias (AUSENTE) en el curso => el estudiante queda fuera. */
export const MAX_AUSENCIAS_PERMITIDAS = 3;

/** Nota mínima para obtener certificado APROBADO. */
export const NOTA_MINIMA_APROBACION = 70;

/** Tipo provisional del certificado mientras la nota está en registro (se finaliza al emitir). */
export const TIPO_CERT_PENDIENTE = "PENDIENTE";

export class ErrorAsistencia extends Error {}

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

export interface EstadoAsistenciaEstudiante {
  totalSesiones: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  pctAsistencia: number;
  elegibleCertificado: boolean;
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

export interface EvaluacionCertificado {
  elegible: boolean;
  tipo: "APROBADO" | "ASISTENCIA" | null;
  pctAsistencia: number;
  motivo: string | null;
}

export interface Usuario {
  ci: string;
  role: Rol;
}

function soloFecha(valor: Date): string {
  return valor.toISOString().slice(0, 10);
}

function soloHora(valor: Date): string {
  return valor.toISOString().slice(11, 16);
}

export function validarUsuarioSesion(
  sesionCurso: { ciInstructor: string },
  usuario: Usuario,
): void {
  if (usuario.role !== "ADMIN" && sesionCurso.ciInstructor !== usuario.ci) {
    throw new ErrorAsistencia("No tienes permiso sobre este curso.");
  }
}

function validarEstado(estado: string): asserts estado is EstadoAsistencia {
  if (!ESTADOS_ASISTENCIA.includes(estado as EstadoAsistencia)) {
    throw new ErrorAsistencia(`Estado de asistencia inválido: ${estado}`);
  }
}

/** Verifica que el curso esté ACTIVO (permite modificaciones). */
export function validarCursoAbierto(curso: { estado: string }): void {
  if (curso.estado !== "ACTIVO") {
    throw new ErrorAsistencia("El curso está cerrado. No se pueden realizar modificaciones.");
  }
}

/** Cursos (propios si es instructor) con resumen de asistencia por sesión. */
export async function getMisCursosConAsistencia(usuario: Usuario): Promise<CursoAsistencia[]> {
  const whereCurso = usuario.role === "ADMIN" ? {} : { ciInstructor: usuario.ci };

  const [cursos, conteos] = await Promise.all([
    prisma.curso.findMany({
      where: whereCurso,
      include: {
        sesiones: {
          orderBy: { fecha: "asc" },
          include: { ambiente: { select: { nombre: true } } },
        },
      },
      orderBy: { fechaIni: "desc" },
    }),
    prisma.asistencia.groupBy({
      by: ["idSesion", "estado"],
      _count: { _all: true },
      where: { sesion: { curso: whereCurso } },
    }),
  ]);

  const porSesion = new Map<number, Record<EstadoAsistencia, number>>();
  for (const fila of conteos) {
    const actual = porSesion.get(fila.idSesion) ?? { PRESENTE: 0, AUSENTE: 0, JUSTIFICADA: 0 };
    actual[fila.estado] = fila._count._all;
    porSesion.set(fila.idSesion, actual);
  }

  return cursos.map((curso) => ({
    codigo: curso.codigo,
    nombre: curso.nombre,
    grupo: curso.grupo,
    nivel: curso.nivel,
    fechaIni: soloFecha(curso.fechaIni),
    fechaFin: soloFecha(curso.fechaFin),
    estado: curso.estado,
    numInscritos: curso.numInscritos,
    sesiones: curso.sesiones.map((sesion) => {
      const conteo = porSesion.get(sesion.id) ?? { PRESENTE: 0, AUSENTE: 0, JUSTIFICADA: 0 };
      const presentes = conteo.PRESENTE;
      const ausentes = conteo.AUSENTE;
      const justificadas = conteo.JUSTIFICADA;
      return {
        id: sesion.id,
        fecha: soloFecha(sesion.fecha),
        horaInicio: soloHora(sesion.horaInicio),
        horaFin: soloHora(sesion.horaFin),
        ambiente: sesion.ambiente?.nombre ?? null,
        total: presentes + ausentes + justificadas,
        presentes,
        ausentes,
        justificadas,
      };
    }),
  }));
}

/** Lista de estudiantes inscritos con su estado de asistencia en una sesión. */
export async function getAsistenciaBySesion(idSesion: number, usuario: Usuario) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: idSesion },
    include: {
      curso: {
        include: {
          instructor: { include: { usuario: { select: { nombres: true, apellidos: true } } } },
        },
      },
      ambiente: { select: { nombre: true } },
    },
  });

  if (!sesion) throw new ErrorAsistencia("La sesión no existe.");
  validarUsuarioSesion(sesion.curso, usuario);

  const [asistencias, inscripciones] = await Promise.all([
    prisma.asistencia.findMany({
      where: { idSesion },
      include: {
        estudiante: {
          include: { usuario: { select: { nombres: true, apellidos: true } } },
        },
      },
    }),
    prisma.inscripcion.findMany({
      where: { codigoCurso: sesion.codigoCurso, estado: "INSCRITO" },
      include: {
        estudiante: {
          include: { usuario: { select: { nombres: true, apellidos: true } } },
        },
      },
    }),
  ]);

  const porEstudiante = new Map(asistencias.map((a) => [a.ciEstudiante, a]));

  const filas: AsistenciaEstudiante[] = inscripciones.map((inscripcion) => {
    const registro = porEstudiante.get(inscripcion.ciEstudiante);
    return {
      id: registro?.id ?? null,
      ciEstudiante: inscripcion.ciEstudiante,
      nombres: inscripcion.estudiante.usuario.nombres,
      apellidos: inscripcion.estudiante.usuario.apellidos,
      codigoSis: inscripcion.estudiante.codigoSis,
      estado: registro?.estado ?? "AUSENTE",
    };
  });

  return {
    sesion: {
      id: sesion.id,
      fecha: soloFecha(sesion.fecha),
      horaInicio: soloHora(sesion.horaInicio),
      horaFin: soloHora(sesion.horaFin),
      ambiente: sesion.ambiente?.nombre ?? null,
      curso: {
        codigo: sesion.curso.codigo,
        nombre: sesion.curso.nombre,
        instructor: `${sesion.curso.instructor.usuario.nombres} ${sesion.curso.instructor.usuario.apellidos}`,
      },
    },
    asistencias: filas.sort((a, b) => a.apellidos.localeCompare(b.apellidos)),
  };
}

/** Actualiza (o crea) la asistencia de una sesión en lote. Devuelve cuántos registros se procesaron. */
export async function bulkUpdateAsistencia(
  idSesion: number,
  updates: { ciEstudiante: string; estado: string }[],
  usuario: Usuario,
): Promise<number> {
  if (updates.length === 0) throw new ErrorAsistencia("No se recibieron registros para actualizar.");

  const sesion = await prisma.sesion.findUnique({
    where: { id: idSesion },
    select: {
      codigoCurso: true,
      curso: { select: { ciInstructor: true, estado: true } },
    },
  });

  if (!sesion) throw new ErrorAsistencia("La sesión no existe.");
  validarUsuarioSesion(sesion.curso, usuario);
  validarCursoAbierto(sesion.curso);

  for (const update of updates) validarEstado(update.estado);

  const cis = updates.map((u) => u.ciEstudiante);
  const inscritos = await prisma.inscripcion.findMany({
    where: { codigoCurso: sesion.codigoCurso, ciEstudiante: { in: cis }, estado: "INSCRITO" },
    select: { ciEstudiante: true },
  });
  const conjuntoInscritos = new Set(inscritos.map((i) => i.ciEstudiante));
  const noInscrito = cis.find((ci) => !conjuntoInscritos.has(ci));
  if (noInscrito) {
    throw new ErrorAsistencia(`El estudiante ${noInscrito} no está inscrito en el curso.`);
  }

  await prisma.$transaction(
    updates.map((update) =>
      prisma.asistencia.upsert({
        where: {
          idSesion_ciEstudiante: { idSesion, ciEstudiante: update.ciEstudiante },
        },
        create: {
          idSesion,
          ciEstudiante: update.ciEstudiante,
          estado: update.estado as EstadoAsistencia,
        },
        update: { estado: update.estado as EstadoAsistencia },
      }),
    ),
  );

  return updates.length;
}

/** Crea los registros de asistencia (AUSENTE) para todas las sesiones del curso al inscribir. */
export async function crearAsistenciasParaInscripcion(
  ciEstudiante: string,
  codigoCurso: string,
): Promise<void> {
  const sesiones = await prisma.sesion.findMany({
    where: { codigoCurso },
    select: { id: true },
  });
  if (sesiones.length === 0) return;

  await prisma.asistencia.createMany({
    data: sesiones.map((sesion) => ({
      idSesion: sesion.id,
      ciEstudiante,
      estado: "AUSENTE" as const,
    })),
    skipDuplicates: true,
  });
}

/**
 * Estado de asistencia de un estudiante en un curso.
 * JUSTIFICADA cuenta como presente para el %.
 * Ausencias = total - presentes - justificadas (registros faltantes cuentan como ausencia).
 */
export async function calcularEstadoAsistencia(
  ciEstudiante: string,
  codigoCurso: string,
): Promise<EstadoAsistenciaEstudiante> {
  const [totalSesiones, agrupado] = await Promise.all([
    prisma.sesion.count({ where: { codigoCurso } }),
    prisma.asistencia.groupBy({
      by: ["estado"],
      _count: { _all: true },
      where: { ciEstudiante, sesion: { codigoCurso } },
    }),
  ]);

  const porEstado = new Map(agrupado.map((fila) => [fila.estado, fila._count._all]));
  const presentes = porEstado.get("PRESENTE") ?? 0;
  const justificadas = porEstado.get("JUSTIFICADA") ?? 0;
  const asistentes = presentes + justificadas;
  const ausentes = Math.max(0, totalSesiones - asistentes);
  const pctAsistencia =
    totalSesiones > 0 ? Math.round((asistentes / totalSesiones) * 10000) / 100 : 0;

  return {
    totalSesiones,
    presentes,
    justificadas,
    ausentes,
    pctAsistencia,
    elegibleCertificado: ausentes <= MAX_AUSENCIAS_PERMITIDAS,
  };
}

/** Evalúa qué certificado le corresponde al estudiante según nota y asistencia. */
export async function evaluarCertificado(
  ciEstudiante: string,
  codigoCurso: string,
  notaFinal: number,
): Promise<EvaluacionCertificado> {
  const estado = await calcularEstadoAsistencia(ciEstudiante, codigoCurso);

  if (!estado.elegibleCertificado) {
    return {
      elegible: false,
      tipo: null,
      pctAsistencia: estado.pctAsistencia,
      motivo: `Supera el máximo de ${MAX_AUSENCIAS_PERMITIDAS} ausencias (${estado.ausentes}).`,
    };
  }

  return {
    elegible: true,
    tipo: notaFinal >= NOTA_MINIMA_APROBACION ? "APROBADO" : "ASISTENCIA",
    pctAsistencia: estado.pctAsistencia,
    motivo: null,
  };
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
  /** Desglose por evaluación (vacío si el curso no define evaluaciones). */
  evaluaciones: { nombre: string; peso: number; nota: number | null }[];
  /** Nota mínima para APROBADO, configurable por curso. */
  notaMinima: number;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
  /** Fecha de emisión del certificado, si existe. Null con fecha emisión. */
  fechaEmision: string | null;
}

/** Progreso de un estudiante: asistencia + nota + certificado por cada curso inscrito. */
export async function getProgresoEstudiante(ciEstudiante: string): Promise<ProgresoCurso[]> {
  const [inscripciones, certificados, notasBrutas] = await Promise.all([
    prisma.inscripcion.findMany({
      where: { ciEstudiante, estado: "INSCRITO" },
      include: {
        curso: {
          include: {
            instructor: {
              include: { usuario: { select: { nombres: true, apellidos: true } } },
            },
            sesiones: {
              orderBy: { fecha: "asc" },
              select: { horaInicio: true, horaFin: true },
            },
            evaluaciones: {
              orderBy: [{ orden: "asc" }, { id: "asc" }],
              select: { id: true, nombre: true, peso: true },
            },
          },
        },
      },
    }),
    prisma.certificado.findMany({
      where: { ciEstudiante },
      select: {
        codigoCurso: true,
        codigoVerificacion: true,
        tipo: true,
        notaFinal: true,
        fechaEmision: true,
      },
    }),
    prisma.nota.findMany({
      where: { ciEstudiante },
      select: { idEvaluacion: true, valor: true },
    }),
  ]);

  const notaPorEvaluacion = new Map<number, number>(
    notasBrutas.map((nota) => [nota.idEvaluacion, Number(nota.valor)]),
  );

  const certificadoPorCurso = new Map(
    certificados.map((certificado) => [certificado.codigoCurso, certificado]),
  );

  const progreso: ProgresoCurso[] = [];
  for (const inscripcion of inscripciones) {
    const estado = await calcularEstadoAsistencia(ciEstudiante, inscripcion.codigoCurso);
    const certificado = certificadoPorCurso.get(inscripcion.codigoCurso);

    // Horario agregado de las sesiones (ej. "08:00 - 10:00 / 14:00 - 16:00").
    const rangosHorario = [
      ...new Set(
        inscripcion.curso.sesiones.map(
          (sesion) => `${soloHora(sesion.horaInicio)} - ${soloHora(sesion.horaFin)}`,
        ),
      ),
    ].sort();

    progreso.push({
      codigo: inscripcion.curso.codigo,
      nombre: inscripcion.curso.nombre,
      grupo: inscripcion.curso.grupo,
      nivel: inscripcion.curso.nivel,
      fechaIni: soloFecha(inscripcion.curso.fechaIni),
      fechaFin: soloFecha(inscripcion.curso.fechaFin),
      instructor: `${inscripcion.curso.instructor.usuario.nombres} ${inscripcion.curso.instructor.usuario.apellidos}`,
      duracionHoras: inscripcion.curso.duracionHoras,
      horario: rangosHorario.length > 0 ? rangosHorario.join(" / ") : null,
      estadoCurso: inscripcion.curso.estado,
      totalSesiones: estado.totalSesiones,
      presentes: estado.presentes,
      justificadas: estado.justificadas,
      ausentes: estado.ausentes,
      pctAsistencia: estado.pctAsistencia,
      elegibleCertificado: estado.elegibleCertificado,
      notaFinal: certificado?.notaFinal != null ? Number(certificado.notaFinal) : null,
      evaluaciones: inscripcion.curso.evaluaciones.map((evaluacion) => ({
        nombre: evaluacion.nombre,
        peso: Number(evaluacion.peso),
        nota: notaPorEvaluacion.get(evaluacion.id) ?? null,
      })),
      notaMinima: Number(inscripcion.curso.notaMinimaAprobacion),
      tipoCertificado: certificado?.tipo ?? null,
      codigoVerificacion: certificado?.codigoVerificacion ?? null,
      fechaEmision: certificado?.fechaEmision ? soloFecha(certificado.fechaEmision) : null,
    });
  }

  return progreso;
}

/** Estudiantes inscritos con su nota (si existe) y estado de asistencia. Para la página de notas. */
export async function getEstudiantesCurso(
  codigoCurso: string,
  usuario: Usuario,
): Promise<EstudianteCursoEstado[]> {
  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { ciInstructor: true, codigo: true },
  });
  if (!curso) throw new ErrorAsistencia("El curso no existe.");
  validarUsuarioSesion(curso, usuario);

  const [inscripciones, certificados, sesiones, asistenciasPorEstudiante] = await Promise.all([
    prisma.inscripcion.findMany({
      where: { codigoCurso, estado: "INSCRITO" },
      include: {
        estudiante: {
          include: { usuario: { select: { nombres: true, apellidos: true } } },
        },
      },
      orderBy: { fechaInscripcion: "asc" },
    }),
    prisma.certificado.findMany({
      where: { codigoCurso },
      select: { ciEstudiante: true, notaFinal: true, tipo: true, codigoVerificacion: true },
    }),
    prisma.sesion.count({ where: { codigoCurso } }),
    prisma.asistencia.groupBy({
      by: ["ciEstudiante", "estado"],
      _count: { _all: true },
      where: { sesion: { codigoCurso } },
    }),
  ]);

  const notas = new Map(certificados.map((c) => [c.ciEstudiante, c.notaFinal]));
  const tipos = new Map(certificados.map((c) => [c.ciEstudiante, c.tipo]));
  const codigos = new Map(certificados.map((c) => [c.ciEstudiante, c.codigoVerificacion]));
  const porEstudiante = new Map<string, Record<string, number>>();
  for (const fila of asistenciasPorEstudiante) {
    const actual = porEstudiante.get(fila.ciEstudiante) ?? {};
    actual[fila.estado] = fila._count._all;
    porEstudiante.set(fila.ciEstudiante, actual);
  }

  return inscripciones.map((inscripcion) => {
    const conteo = porEstudiante.get(inscripcion.ciEstudiante) ?? {};
    const presentes = conteo.PRESENTE ?? 0;
    const justificadas = conteo.JUSTIFICADA ?? 0;
    const asistentes = presentes + justificadas;
    const ausentes = Math.max(0, sesiones - asistentes);
    const pctAsistencia = sesiones > 0 ? Math.round((asistentes / sesiones) * 10000) / 100 : 0;
    const nota = notas.get(inscripcion.ciEstudiante);

    return {
      ci: inscripcion.ciEstudiante,
      nombres: inscripcion.estudiante.usuario.nombres,
      apellidos: inscripcion.estudiante.usuario.apellidos,
      codigoSis: inscripcion.estudiante.codigoSis,
      notaFinal: nota !== null && nota !== undefined ? Number(nota) : null,
      pctAsistencia,
      presentes,
      justificadas,
      ausentes,
      elegibleCertificado: ausentes <= MAX_AUSENCIAS_PERMITIDAS,
      tipoCertificado: tipos.get(inscripcion.ciEstudiante) ?? null,
      codigoVerificacion: codigos.get(inscripcion.ciEstudiante) ?? null,
    };
  });
}

/** Código de verificación único para un certificado (formato CERT-YYYY-XXXXXX). */
export async function generarCodigoVerificacion(): Promise<string> {
  const anio = new Date().getFullYear();
  for (let intento = 0; intento < 5; intento++) {
    const sufijo = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
    const codigo = `CERT-${anio}-${sufijo}`;
    const existe = await prisma.certificado.findUnique({
      where: { codigoVerificacion: codigo },
      select: { id: true },
    });
    if (!existe) return codigo;
  }
  throw new ErrorAsistencia("No se pudo generar un código de verificación único.");
}

export interface NotaUpdate {
  ci: string;
  notaFinal: number;
}

export interface ResultadoNotas {
  guardados: number;
  restantes: number;
}

/**
 * Guarda notas de un curso (crea certificados pendientes o actualiza los existentes).
 * `restantes` = inscritos aún sin nota.
 */
export async function guardarNotas(
  codigoCurso: string,
  updates: NotaUpdate[],
  usuario: Usuario,
): Promise<ResultadoNotas> {
  if (updates.length === 0) throw new ErrorAsistencia("No se recibieron notas para guardar.");

  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { ciInstructor: true, codigo: true, estado: true },
  });
  if (!curso) throw new ErrorAsistencia("El curso no existe.");
  validarUsuarioSesion(curso, usuario);
  validarCursoAbierto(curso);

  // Con evaluaciones definidas la nota final es el promedio calculado: no se
  // permite editarla directamente para no pisar el resultado.
  const totalEvaluaciones = await prisma.evaluacion.count({ where: { codigoCurso } });
  if (totalEvaluaciones > 0) {
    throw new ErrorAsistencia(
      "Este curso tiene evaluaciones definidas: la nota final se calcula como promedio. Registra las notas en cada evaluación.",
    );
  }

  for (const update of updates) {
    if (typeof update.ci !== "string" || update.ci.length === 0) {
      throw new ErrorAsistencia("Estudiante inválido en la lista de notas.");
    }
    if (
      typeof update.notaFinal !== "number" ||
      !Number.isFinite(update.notaFinal) ||
      update.notaFinal < 0 ||
      update.notaFinal > 100
    ) {
      throw new ErrorAsistencia(
        `Nota inválida para el estudiante ${update.ci}: debe estar entre 0 y 100.`,
      );
    }
  }

  const cis = updates.map((u) => u.ci);
  const inscritos = await prisma.inscripcion.findMany({
    where: { codigoCurso, ciEstudiante: { in: cis }, estado: "INSCRITO" },
    select: { ciEstudiante: true },
  });
  const conjuntoInscritos = new Set(inscritos.map((i) => i.ciEstudiante));
  const noInscrito = cis.find((ci) => !conjuntoInscritos.has(ci));
  if (noInscrito) {
    throw new ErrorAsistencia(`El estudiante ${noInscrito} no está inscrito en el curso.`);
  }

  const existentes = await prisma.certificado.findMany({
    where: { codigoCurso, ciEstudiante: { in: cis } },
    select: { ciEstudiante: true, tipo: true },
  });
  const existentePorCi = new Map(existentes.map((c) => [c.ciEstudiante, c]));

  const operaciones = [];
  for (const update of updates) {
    const existente = existentePorCi.get(update.ci);
    if (existente) {
      const data: { notaFinal: number; tipo?: string } = { notaFinal: update.notaFinal };

      // Certificado ya emitido: re-evaluar el tipo según la nueva nota (si el estudiante sigue habilitado).
      if (existente.tipo !== TIPO_CERT_PENDIENTE) {
        const estado = await calcularEstadoAsistencia(update.ci, codigoCurso);
        if (estado.elegibleCertificado) {
          data.tipo =
            update.notaFinal >= NOTA_MINIMA_APROBACION ? "APROBADO" : "ASISTENCIA";
        }
      }

      operaciones.push(
        prisma.certificado.update({
          where: { ciEstudiante_codigoCurso: { ciEstudiante: update.ci, codigoCurso } },
          data,
        }),
      );
    } else {
      operaciones.push(
        prisma.certificado.create({
          data: {
            codigoVerificacion: await generarCodigoVerificacion(),
            ciEstudiante: update.ci,
            codigoCurso,
            fechaEmision: new Date(),
            tipo: TIPO_CERT_PENDIENTE,
            notaFinal: update.notaFinal,
          },
        }),
      );
    }
  }
  await prisma.$transaction(operaciones);

  const [todosInscritos, conNota] = await Promise.all([
    prisma.inscripcion.findMany({
      where: { codigoCurso, estado: "INSCRITO" },
      select: { ciEstudiante: true },
    }),
    prisma.certificado.findMany({
      where: { codigoCurso, notaFinal: { not: null } },
      select: { ciEstudiante: true },
    }),
  ]);
  const conjuntoConNota = new Set(conNota.map((c) => c.ciEstudiante));
  const restantes = todosInscritos.filter(
    (i) => !conjuntoConNota.has(i.ciEstudiante),
  ).length;

  return { guardados: updates.length, restantes };
}

export interface ResultadoCierre {
  codigo: string;
  estado: string;
}

/**
 * Cierra un curso (ACTIVO → CERRADO).
 * Requiere que todos los estudiantes inscritos tengan nota registrada.
 */
export async function cerrarCurso(codigoCurso: string, usuario: Usuario): Promise<ResultadoCierre> {
  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { ciInstructor: true, codigo: true, estado: true },
  });
  if (!curso) throw new ErrorAsistencia("El curso no existe.");
  validarUsuarioSesion(curso, usuario);

  if (curso.estado !== "ACTIVO") {
    throw new ErrorAsistencia("El curso no está activo. Solo se pueden cerrar cursos activos.");
  }

  const [inscritos, conNota] = await Promise.all([
    prisma.inscripcion.findMany({
      where: { codigoCurso, estado: "INSCRITO" },
      select: { ciEstudiante: true },
    }),
    prisma.certificado.findMany({
      where: { codigoCurso, notaFinal: { not: null } },
      select: { ciEstudiante: true },
    }),
  ]);
  const conjuntoConNota = new Set(conNota.map((c) => c.ciEstudiante));
  const faltantes = inscritos.filter((i) => !conjuntoConNota.has(i.ciEstudiante));
  if (faltantes.length > 0) {
    const ciEjemplo = faltantes.map((f) => f.ciEstudiante).join(", ");
    throw new ErrorAsistencia(
      `No se puede cerrar el curso: ${faltantes.length} estudiante(s) sin nota (CI: ${ciEjemplo}).`,
    );
  }

  await prisma.curso.update({
    where: { codigo: codigoCurso },
    data: { estado: "CERRADO" },
  });

  return { codigo: codigoCurso, estado: "CERRADO" };
}

/**
 * Reabre un curso (CERRADO → ACTIVO). Solo ADMIN.
 */
export async function reabrirCurso(codigoCurso: string, usuario: Usuario): Promise<ResultadoCierre> {
  if (usuario.role !== "ADMIN") {
    throw new ErrorAsistencia("Solo un administrador puede reabrir un curso.");
  }

  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { codigo: true, estado: true },
  });
  if (!curso) throw new ErrorAsistencia("El curso no existe.");

  if (curso.estado !== "CERRADO") {
    throw new ErrorAsistencia("El curso no está cerrado. Solo se pueden reabrir cursos cerrados.");
  }

  await prisma.curso.update({
    where: { codigo: codigoCurso },
    data: { estado: "ACTIVO" },
  });

  return { codigo: codigoCurso, estado: "ACTIVO" };
}
