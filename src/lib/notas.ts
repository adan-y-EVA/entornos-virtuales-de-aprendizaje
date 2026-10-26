import "server-only";
import { prisma } from "@/src/lib/prisma";
import {
  MAX_AUSENCIAS_PERMITIDAS,
  TIPO_CERT_PENDIENTE,
  calcularEstadoAsistencia,
  generarCodigoVerificacion,
  validarCursoAbierto,
  validarUsuarioSesion,
  type Usuario,
} from "@/src/lib/asistencia";

export class ErrorNotas extends Error {}

const LIMITE_NOMBRE = 80;

export interface EvaluacionBasica {
  id: number;
  nombre: string;
  peso: number;
  orden: number;
}

export interface EvaluacionResumen extends EvaluacionBasica {
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
  /**
   * Nota final del estudiante.
   * En modo "evaluaciones" es el promedio ponderado calculado; en modo
   * "nota_unica" es la nota cargada directamente en el certificado.
   */
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

export interface DetalleNotasCurso {
  /**
   * "evaluaciones": el instructor definió evaluaciones y el promedio se calcula.
   * "nota_unica": sin evaluaciones, se carga una única nota final (modo legado).
   */
  modo: "evaluaciones" | "nota_unica";
  evaluaciones: EvaluacionResumen[];
  estudiantes: EstudianteNotas[];
  resumen: ResumenNotas;
}

interface CursoPermisos {
  codigo: string;
  ciInstructor: string;
  estado: string;
  notaMinimaAprobacion: unknown;
}

const SELECT_CURSO = {
  codigo: true,
  ciInstructor: true,
  estado: true,
  notaMinimaAprobacion: true,
} as const;

async function obtenerCursoPermisos(codigoCurso: string): Promise<CursoPermisos | null> {
  return prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: SELECT_CURSO,
  });
}

/**
 * Resuelve una evaluación verificando que pertenezca al curso de la URL.
 * Así no se pueden tocar evaluaciones de otro curso cambiando el id.
 */
async function resolverEvaluacion(
  idEvaluacion: number,
  codigoCurso: string,
): Promise<CursoPermisos> {
  const evaluacion = await prisma.evaluacion.findFirst({
    where: { id: idEvaluacion, codigoCurso },
    select: { curso: { select: SELECT_CURSO } },
  });
  if (!evaluacion) throw new ErrorNotas("La evaluación no existe en este curso.");
  return evaluacion.curso;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Promedio ponderado: `sum(nota x peso) / sum(peso)` sobre las evaluaciones
 * que tengan nota cargada. Los pesos no tienen que sumar 100: se normalizan.
 * Devuelve `null` si ninguna evaluación tiene nota.
 */
export function calcularPromedioPonderado(
  notas: Record<number, number | null | undefined>,
  evaluaciones: { id: number; peso: number }[],
): number | null {
  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const evaluacion of evaluaciones) {
    const valor = notas[evaluacion.id];
    if (valor === null || valor === undefined || Number.isNaN(valor)) continue;
    sumaPonderada += valor * Number(evaluacion.peso);
    sumaPesos += Number(evaluacion.peso);
  }

  if (sumaPesos <= 0) return null;
  return redondear(sumaPonderada / sumaPesos);
}

async function evaluacionesBasicas(codigoCurso: string): Promise<EvaluacionBasica[]> {
  const lista = await prisma.evaluacion.findMany({
    where: { codigoCurso },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, peso: true, orden: true },
  });
  return lista.map((e) => ({ ...e, peso: Number(e.peso) }));
}

/**
 * Recalcula el promedio de un estudiante y lo escribe en `Certificado.notaFinal`,
 * que es el campo que alimenta el cierre de curso y la emisión de certificados.
 *
 * - Sin evaluaciones definidas: no toca el certificado (respeta la nota única legada).
 * - Con evaluaciones y sin ninguna nota: deja `notaFinal` en null.
 * - Con evaluaciones y nota: crea el certificado PENDIENTE si no existe, o
 *   re-evalúa el tipo si ya estaba emitido.
 */
export async function sincronizarPromedio(
  ciEstudiante: string,
  codigoCurso: string,
  evaluaciones: EvaluacionBasica[],
  notaMinima: number,
): Promise<number | null> {
  const existente = await prisma.certificado.findUnique({
    where: { ciEstudiante_codigoCurso: { ciEstudiante, codigoCurso } },
    select: { tipo: true, notaFinal: true },
  });

  // Modo nota única: la nota vive directamente en el certificado.
  if (evaluaciones.length === 0) {
    return existente?.notaFinal != null ? Number(existente.notaFinal) : null;
  }

  const notas = await prisma.nota.findMany({
    where: { ciEstudiante, evaluacion: { codigoCurso } },
    select: { idEvaluacion: true, valor: true },
  });
  const porEvaluacion: Record<number, number> = {};
  for (const nota of notas) porEvaluacion[nota.idEvaluacion] = Number(nota.valor);

  const promedio = calcularPromedioPonderado(porEvaluacion, evaluaciones);

  // Sin ninguna nota cargada: no creamos un certificado vacío y limpiamos la nota.
  if (promedio === null) {
    if (existente) {
      await prisma.certificado.update({
        where: { ciEstudiante_codigoCurso: { ciEstudiante, codigoCurso } },
        data: { notaFinal: null },
      });
    }
    return null;
  }

  if (existente) {
    const data: { notaFinal: number; tipo?: string } = { notaFinal: promedio };

    // Certificado ya emitido: re-evaluar el tipo según la nueva nota.
    if (existente.tipo !== TIPO_CERT_PENDIENTE) {
      const estado = await calcularEstadoAsistencia(ciEstudiante, codigoCurso);
      if (estado.elegibleCertificado) {
        data.tipo = promedio >= notaMinima ? "APROBADO" : "ASISTENCIA";
      }
    }

    await prisma.certificado.update({
      where: { ciEstudiante_codigoCurso: { ciEstudiante, codigoCurso } },
      data,
    });
  } else {
    await prisma.certificado.create({
      data: {
        codigoVerificacion: await generarCodigoVerificacion(),
        ciEstudiante,
        codigoCurso,
        fechaEmision: new Date(),
        tipo: TIPO_CERT_PENDIENTE,
        notaFinal: promedio,
      },
    });
  }

  return promedio;
}

/** Recalcula el promedio de todos los inscritos de un curso. */
async function resincronizarPromediosCurso(
  codigoCurso: string,
  evaluaciones: EvaluacionBasica[],
  notaMinima: number,
): Promise<void> {
  const inscritos = await prisma.inscripcion.findMany({
    where: { codigoCurso, estado: "INSCRITO" },
    select: { ciEstudiante: true },
  });

  for (const inscrito of inscritos) {
    await sincronizarPromedio(inscrito.ciEstudiante, codigoCurso, evaluaciones, notaMinima);
  }
}

/** Lista de estudiantes inscritos con sus notas por evaluación y su promedio. */
export async function getDetalleNotasCurso(
  codigoCurso: string,
  usuario: Usuario,
): Promise<DetalleNotasCurso> {
  const curso = await obtenerCursoPermisos(codigoCurso);
  if (!curso) throw new ErrorNotas("El curso no existe.");
  validarUsuarioSesion(curso, usuario);

  const notaMinima = Number(curso.notaMinimaAprobacion);

  const [evaluaciones, inscripciones, notasBrutas, certificados, totalSesiones, agrupado] =
    await Promise.all([
      prisma.evaluacion.findMany({
        where: { codigoCurso },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        select: { id: true, nombre: true, peso: true, orden: true, _count: { select: { notas: true } } },
      }),
      prisma.inscripcion.findMany({
        where: { codigoCurso, estado: "INSCRITO" },
        include: {
          estudiante: {
            include: { usuario: { select: { nombres: true, apellidos: true } } },
          },
        },
        orderBy: { fechaInscripcion: "asc" },
      }),
      prisma.nota.findMany({
        where: { evaluacion: { codigoCurso } },
        select: { idEvaluacion: true, ciEstudiante: true, valor: true },
      }),
      prisma.certificado.findMany({
        where: { codigoCurso },
        select: { ciEstudiante: true, tipo: true, codigoVerificacion: true, notaFinal: true },
      }),
      prisma.sesion.count({ where: { codigoCurso } }),
      prisma.asistencia.groupBy({
        by: ["ciEstudiante", "estado"],
        _count: { _all: true },
        where: { sesion: { codigoCurso } },
      }),
    ]);

  const modo: DetalleNotasCurso["modo"] = evaluaciones.length > 0 ? "evaluaciones" : "nota_unica";
  const evaluacionesResumen: EvaluacionResumen[] = evaluaciones.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    peso: Number(e.peso),
    orden: e.orden,
    totalNotas: e._count.notas,
  }));
  const basicas: EvaluacionBasica[] = evaluacionesResumen;

  const certificadoPorCi = new Map(certificados.map((c) => [c.ciEstudiante, c]));

  const notasPorEstudiante = new Map<string, Record<number, number>>();
  for (const nota of notasBrutas) {
    const registro = notasPorEstudiante.get(nota.ciEstudiante) ?? {};
    registro[nota.idEvaluacion] = Number(nota.valor);
    notasPorEstudiante.set(nota.ciEstudiante, registro);
  }

  const asistenciaPorEstudiante = new Map<string, Record<string, number>>();
  for (const fila of agrupado) {
    const actual = asistenciaPorEstudiante.get(fila.ciEstudiante) ?? {};
    actual[fila.estado] = fila._count._all;
    asistenciaPorEstudiante.set(fila.ciEstudiante, actual);
  }

  const estudiantes: EstudianteNotas[] = inscripciones.map((inscripcion) => {
    const ci = inscripcion.ciEstudiante;
    const conteo = asistenciaPorEstudiante.get(ci) ?? {};
    const presentes = conteo.PRESENTE ?? 0;
    const justificadas = conteo.JUSTIFICADA ?? 0;
    const asistentes = presentes + justificadas;
    const ausentes = Math.max(0, totalSesiones - asistentes);
    const pctAsistencia = totalSesiones > 0 ? redondear((asistentes / totalSesiones) * 100) : 0;

    const delCurso = notasPorEstudiante.get(ci) ?? {};
    const notas: Record<number, number | null> = {};
    for (const evaluacion of evaluacionesResumen) {
      notas[evaluacion.id] = delCurso[evaluacion.id] ?? null;
    }

    const certificado = certificadoPorCi.get(ci);
    const promedio =
      modo === "evaluaciones"
        ? calcularPromedioPonderado(delCurso, basicas)
        : certificado?.notaFinal != null
          ? Number(certificado.notaFinal)
          : null;

    return {
      ci,
      nombres: inscripcion.estudiante.usuario.nombres,
      apellidos: inscripcion.estudiante.usuario.apellidos,
      codigoSis: inscripcion.estudiante.codigoSis,
      pctAsistencia,
      presentes,
      justificadas,
      ausentes,
      elegibleCertificado: ausentes <= MAX_AUSENCIAS_PERMITIDAS,
      notas,
      promedio,
      tipoCertificado: certificado?.tipo ?? null,
      codigoVerificacion: certificado?.codigoVerificacion ?? null,
    };
  });

  const conNota = estudiantes.filter((e) => e.promedio !== null);
  const promedioGeneral =
    conNota.length > 0
      ? redondear(conNota.reduce((suma, e) => suma + (e.promedio ?? 0), 0) / conNota.length)
      : null;

  return {
    modo,
    evaluaciones: evaluacionesResumen,
    estudiantes,
    resumen: {
      notaMinima,
      inscritos: estudiantes.length,
      conNota: conNota.length,
      sinNota: estudiantes.length - conNota.length,
      aprobados: conNota.filter((e) => (e.promedio ?? 0) >= notaMinima).length,
      reprobados: conNota.filter((e) => (e.promedio ?? 0) < notaMinima).length,
      promedioGeneral,
    },
  };
}

export interface DatosEvaluacion {
  nombre?: unknown;
  peso?: unknown;
  orden?: unknown;
}

function validarEvaluacion(
  datos: DatosEvaluacion,
): { nombre: string; peso: number; orden?: number } {
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  if (!nombre) throw new ErrorNotas("El nombre de la evaluación es obligatorio.");
  if (nombre.length > LIMITE_NOMBRE) {
    throw new ErrorNotas(`El nombre no puede superar ${LIMITE_NOMBRE} caracteres.`);
  }

  const peso = Number(datos.peso);
  if (!Number.isFinite(peso) || peso <= 0 || peso > 100) {
    throw new ErrorNotas("El peso debe ser un número mayor a 0 y hasta 100.");
  }

  const orden = datos.orden === undefined ? undefined : Number(datos.orden);

  return { nombre, peso, orden: Number.isFinite(orden as number) ? (orden as number) : undefined };
}

async function validarNombreUnico(
  codigoCurso: string,
  nombre: string,
  excluirId?: number,
): Promise<void> {
  const existente = await prisma.evaluacion.findFirst({
    where: {
      codigoCurso,
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
    select: { id: true },
  });
  if (existente) {
    throw new ErrorNotas(`Ya existe una evaluación llamada "${nombre}" en este curso.`);
  }
}

export async function crearEvaluacion(
  codigoCurso: string,
  datos: DatosEvaluacion,
  usuario: Usuario,
): Promise<EvaluacionResumen> {
  const curso = await obtenerCursoPermisos(codigoCurso);
  if (!curso) throw new ErrorNotas("El curso no existe.");
  validarUsuarioSesion(curso, usuario);
  validarCursoAbierto(curso);

  const validado = validarEvaluacion(datos);
  await validarNombreUnico(codigoCurso, validado.nombre);

  const ultima = await prisma.evaluacion.aggregate({
    where: { codigoCurso },
    _max: { orden: true },
  });

  const creada = await prisma.evaluacion.create({
    data: {
      codigoCurso,
      nombre: validado.nombre,
      peso: validado.peso.toFixed(2),
      orden: validado.orden ?? (ultima._max.orden ?? 0) + 1,
    },
  });

  return {
    id: creada.id,
    nombre: creada.nombre,
    peso: Number(creada.peso),
    orden: creada.orden,
    totalNotas: 0,
  };
}

export async function actualizarEvaluacion(
  codigoCurso: string,
  idEvaluacion: number,
  datos: DatosEvaluacion,
  usuario: Usuario,
): Promise<EvaluacionResumen> {
  const curso = await resolverEvaluacion(idEvaluacion, codigoCurso);
  validarUsuarioSesion(curso, usuario);
  validarCursoAbierto(curso);

  const actual = await prisma.evaluacion.findUniqueOrThrow({
    where: { id: idEvaluacion },
    select: { id: true, nombre: true, peso: true, orden: true },
  });

  const validado = validarEvaluacion({
    ...datos,
    nombre: datos.nombre ?? actual.nombre,
    peso: datos.peso ?? actual.peso,
  });
  await validarNombreUnico(curso.codigo, validado.nombre, idEvaluacion);

  const actualizado = await prisma.evaluacion.update({
    where: { id: idEvaluacion },
    data: {
      nombre: validado.nombre,
      peso: validado.peso.toFixed(2),
      ...(validado.orden !== undefined ? { orden: validado.orden } : {}),
    },
  });

  // Cambiar el peso recalcula el promedio de todos los inscritos.
  const evaluaciones = await evaluacionesBasicas(curso.codigo);
  await resincronizarPromediosCurso(curso.codigo, evaluaciones, Number(curso.notaMinimaAprobacion));

  return {
    id: actualizado.id,
    nombre: actualizado.nombre,
    peso: Number(actualizado.peso),
    orden: actualizado.orden,
    totalNotas: await prisma.nota.count({ where: { idEvaluacion } }),
  };
}

/** Elimina una evaluación (y sus notas en cascada) y recalcula los promedios. */
export async function eliminarEvaluacion(
  codigoCurso: string,
  idEvaluacion: number,
  usuario: Usuario,
): Promise<{ eliminadas: number }> {
  const curso = await resolverEvaluacion(idEvaluacion, codigoCurso);
  validarUsuarioSesion(curso, usuario);
  validarCursoAbierto(curso);

  const eliminadas = await prisma.nota.count({ where: { idEvaluacion } });
  await prisma.evaluacion.delete({ where: { id: idEvaluacion } });

  const evaluaciones = await evaluacionesBasicas(codigoCurso);
  await resincronizarPromediosCurso(codigoCurso, evaluaciones, Number(curso.notaMinimaAprobacion));

  return { eliminadas };
}

export interface NotaUpdate {
  ci: string;
  /** `null` elimina la nota del estudiante en esa evaluación. */
  valor: number | null;
}

export interface ResultadoNotasEvaluacion {
  guardados: number;
  restantes: number;
}

/**
 * Guarda las notas de una evaluación en lote y recalcula el promedio de los
 * estudiantes afectados.
 */
export async function guardarNotasEvaluacion(
  codigoCurso: string,
  idEvaluacion: number,
  updates: NotaUpdate[],
  usuario: Usuario,
): Promise<ResultadoNotasEvaluacion> {
  if (updates.length === 0) throw new ErrorNotas("No se recibieron notas para guardar.");

  const curso = await resolverEvaluacion(idEvaluacion, codigoCurso);
  validarUsuarioSesion(curso, usuario);
  validarCursoAbierto(curso);

  for (const update of updates) {
    if (typeof update.ci !== "string" || update.ci.length === 0) {
      throw new ErrorNotas("Estudiante inválido en la lista de notas.");
    }
    if (update.valor === null) continue;
    if (
      typeof update.valor !== "number" ||
      !Number.isFinite(update.valor) ||
      update.valor < 0 ||
      update.valor > 100
    ) {
      throw new ErrorNotas(
        `Nota inválida para el estudiante ${update.ci}: debe estar entre 0 y 100.`,
      );
    }
  }

  const cis = updates.map((u) => u.ci);
  const inscritos = await prisma.inscripcion.findMany({
    where: { codigoCurso: curso.codigo, ciEstudiante: { in: cis }, estado: "INSCRITO" },
    select: { ciEstudiante: true },
  });
  const conjuntoInscritos = new Set(inscritos.map((i) => i.ciEstudiante));
  const noInscrito = cis.find((ci) => !conjuntoInscritos.has(ci));
  if (noInscrito) {
    throw new ErrorNotas(`El estudiante ${noInscrito} no está inscrito en el curso.`);
  }

  await prisma.$transaction(
    updates.map((update) =>
      update.valor === null
        ? prisma.nota.deleteMany({ where: { idEvaluacion, ciEstudiante: update.ci } })
        : prisma.nota.upsert({
            where: {
              idEvaluacion_ciEstudiante: { idEvaluacion, ciEstudiante: update.ci },
            },
            create: {
              idEvaluacion,
              ciEstudiante: update.ci,
              valor: update.valor.toFixed(2),
            },
            update: { valor: update.valor.toFixed(2) },
          }),
    ),
  );

  const evaluaciones = await evaluacionesBasicas(curso.codigo);
  const notaMinima = Number(curso.notaMinimaAprobacion);
  for (const ci of new Set(cis)) {
    await sincronizarPromedio(ci, curso.codigo, evaluaciones, notaMinima);
  }

  const [todosInscritos, conNota] = await Promise.all([
    prisma.inscripcion.count({ where: { codigoCurso: curso.codigo, estado: "INSCRITO" } }),
    prisma.nota
      .groupBy({ by: ["ciEstudiante"], where: { evaluacion: { codigoCurso: curso.codigo } } })
      .then((filas) => filas.length),
  ]);

  const guardados = updates.filter((u) => u.valor !== null).length;
  return { guardados, restantes: Math.max(0, todosInscritos - conNota) };
}
