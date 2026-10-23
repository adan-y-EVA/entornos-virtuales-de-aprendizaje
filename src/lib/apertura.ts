import "server-only";
import { prisma } from "@/src/lib/prisma";
import type { Rol } from "@/src/lib/auth";
import { crearAsistenciasParaInscripcion } from "@/src/lib/asistencia";

/**
 * Apertura de cursos al cierre de inscripciones.
 *
 * Cerca de la fecha limite el instructor revisa los inscritos:
 *  - si alcanza cuposMin, abre el curso (PENDIENTE -> ABIERTO);
 *  - si no, lo cierra (PENDIENTE -> CERRADO), mueve a los estudiantes a otro
 *    grupo de la misma materia (o cancela su inscripcion si no hay cupo) y
 *    les deja una notificacion.
 */

/** Dias antes de la fecha limite en que un curso aparece como "por revisar". */
export const DIAS_AVISO_APERTURA = 3;

export class ErrorApertura extends Error {}

interface Usuario {
  ci: string;
  role: Rol;
}

export interface CursoPorRevisar {
  codigo: string;
  nombre: string;
  grupo: string;
  codigoMateria: string | null;
  fechaIni: string;
  fechaLimite: string;
  diasRestantes: number;
  inscritos: number;
  cuposMin: number;
  cuposMax: number;
  cumpleMinimo: boolean;
}

export interface GrupoAlternativo {
  codigo: string;
  nombre: string;
  grupo: string;
  instructor: string;
  fechaIni: string;
  inscritos: number;
  cuposMax: number;
  /** null = sin limite de cupos. */
  cuposLibres: number | null;
}

export interface EstudianteAfectado {
  ciEstudiante: string;
  nombre: string;
}

export interface ResultadoCierrePorCupo {
  codigo: string;
  movidos: (EstudianteAfectado & { codigoDestino: string; grupoDestino: string })[];
  cancelados: (EstudianteAfectado & { motivo: string })[];
}

export interface OpcionesCierre {
  /** Grupo destino por defecto para todos los estudiantes (null = cancelar). */
  codigoDestino?: string | null;
  /** Destino por estudiante (CI -> codigo de curso o null). Tiene prioridad. */
  reasignaciones?: Record<string, string | null>;
}

function soloFecha(valor: Date): string {
  return valor.toISOString().slice(0, 10);
}

function hoyLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function diasEntre(desde: string, hasta: string): number {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Fecha limite efectiva: la configurada o, si no hay, la fecha de inicio. */
export function fechaLimiteDe(curso: { fechaLimiteInscripcion: Date | null; fechaIni: Date }): string {
  return soloFecha(curso.fechaLimiteInscripcion ?? curso.fechaIni);
}

function validarPermiso(curso: { ciInstructor: string }, usuario: Usuario): void {
  if (usuario.role !== "ADMIN" && curso.ciInstructor !== usuario.ci) {
    throw new ErrorApertura("No tienes permiso sobre este curso.");
  }
}

/**
 * Cursos PENDIENTE cuya fecha limite esta a `dias` o menos (incluye los ya
 * vencidos que nadie reviso). Instructor: solo los suyos. Admin: todos.
 */
export async function getCursosPorRevisar(
  usuario: Usuario,
  dias = DIAS_AVISO_APERTURA,
): Promise<CursoPorRevisar[]> {
  const cursos = await prisma.curso.findMany({
    where: {
      estadoApertura: "PENDIENTE",
      estado: "ACTIVO",
      ...(usuario.role === "ADMIN" ? {} : { ciInstructor: usuario.ci }),
    },
    select: {
      codigo: true,
      nombre: true,
      grupo: true,
      codigoMateria: true,
      fechaIni: true,
      fechaLimiteInscripcion: true,
      cuposMin: true,
      cuposMax: true,
      _count: { select: { inscripciones: { where: { estado: "INSCRITO" } } } },
    },
  });

  const hoy = hoyLocal();
  return cursos
    .map((curso) => {
      const fechaLimite = fechaLimiteDe(curso);
      const inscritos = curso._count.inscripciones;
      return {
        codigo: curso.codigo,
        nombre: curso.nombre,
        grupo: curso.grupo,
        codigoMateria: curso.codigoMateria,
        fechaIni: soloFecha(curso.fechaIni),
        fechaLimite,
        diasRestantes: diasEntre(hoy, fechaLimite),
        inscritos,
        cuposMin: curso.cuposMin,
        cuposMax: curso.cuposMax,
        cumpleMinimo: inscritos >= curso.cuposMin,
      };
    })
    .filter((curso) => curso.diasRestantes <= dias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

/** Otros grupos de la misma materia que todavia pueden recibir estudiantes. */
export async function getGruposAlternativos(
  codigoCurso: string,
  usuario: Usuario,
): Promise<GrupoAlternativo[]> {
  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { ciInstructor: true, codigoMateria: true },
  });
  if (!curso) throw new ErrorApertura("El curso no existe.");
  validarPermiso(curso, usuario);
  if (!curso.codigoMateria) return [];

  const grupos = await prisma.curso.findMany({
    where: {
      codigoMateria: curso.codigoMateria,
      codigo: { not: codigoCurso },
      estado: "ACTIVO",
      estadoApertura: { not: "CERRADO" },
      fechaFin: { gte: new Date(`${hoyLocal()}T00:00:00Z`) },
    },
    select: {
      codigo: true,
      nombre: true,
      grupo: true,
      fechaIni: true,
      cuposMax: true,
      instructor: { select: { usuario: { select: { nombres: true, apellidos: true } } } },
      _count: { select: { inscripciones: { where: { estado: "INSCRITO" } } } },
    },
    orderBy: { grupo: "asc" },
  });

  return grupos.map((g) => ({
    codigo: g.codigo,
    nombre: g.nombre,
    grupo: g.grupo,
    instructor: `${g.instructor.usuario.nombres} ${g.instructor.usuario.apellidos}`,
    fechaIni: soloFecha(g.fechaIni),
    inscritos: g._count.inscripciones,
    cuposMax: g.cuposMax,
    cuposLibres: g.cuposMax > 0 ? Math.max(0, g.cuposMax - g._count.inscripciones) : null,
  }));
}

/** PENDIENTE -> ABIERTO, solo si alcanza el minimo de inscritos. */
export async function abrirCurso(codigoCurso: string, usuario: Usuario) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT codigo FROM curso WHERE codigo = ${codigoCurso} FOR UPDATE`;

    const curso = await tx.curso.findUnique({
      where: { codigo: codigoCurso },
      select: { ciInstructor: true, estadoApertura: true, cuposMin: true },
    });
    if (!curso) throw new ErrorApertura("El curso no existe.");
    validarPermiso(curso, usuario);
    if (curso.estadoApertura !== "PENDIENTE") {
      throw new ErrorApertura(`El curso ya fue revisado (${curso.estadoApertura}).`);
    }

    const inscritos = await tx.inscripcion.count({
      where: { codigoCurso, estado: "INSCRITO" },
    });
    if (inscritos < curso.cuposMin) {
      throw new ErrorApertura(
        `No alcanza el mínimo: ${inscritos} de ${curso.cuposMin} inscritos. Debes cerrarlo.`,
      );
    }

    await tx.curso.update({
      where: { codigo: codigoCurso },
      data: { estadoApertura: "ABIERTO" },
    });

    return { codigo: codigoCurso, estadoApertura: "ABIERTO" as const, inscritos };
  });
}

/**
 * PENDIENTE -> CERRADO por no alcanzar el minimo. Mueve o cancela a cada
 * inscrito y le crea una notificacion. Todo en una sola transaccion.
 */
export async function cerrarCursoPorCupo(
  codigoCurso: string,
  usuario: Usuario,
  opciones: OpcionesCierre = {},
): Promise<ResultadoCierrePorCupo> {
  const destinoPorDefecto = opciones.codigoDestino ?? null;
  const reasignaciones = opciones.reasignaciones ?? {};

  const resultado = await prisma.$transaction(async (tx) => {
    const destinosPedidos = new Set<string>();
    if (destinoPorDefecto) destinosPedidos.add(destinoPorDefecto);
    for (const destino of Object.values(reasignaciones)) {
      if (destino) destinosPedidos.add(destino);
    }
    if (destinosPedidos.has(codigoCurso)) {
      throw new ErrorApertura("El grupo destino no puede ser el mismo curso.");
    }

    // Bloquea origen y destinos en orden fijo para evitar deadlocks y que
    // otra inscripcion concurrente se pase del cupo.
    const bloquear = [codigoCurso, ...destinosPedidos].sort();
    await tx.$queryRaw`SELECT codigo FROM curso WHERE codigo = ANY(${bloquear}) ORDER BY codigo FOR UPDATE`;

    const origen = await tx.curso.findUnique({
      where: { codigo: codigoCurso },
      select: {
        codigo: true,
        nombre: true,
        grupo: true,
        ciInstructor: true,
        codigoMateria: true,
        estadoApertura: true,
        cuposMin: true,
      },
    });
    if (!origen) throw new ErrorApertura("El curso no existe.");
    validarPermiso(origen, usuario);

    if (origen.estadoApertura !== "PENDIENTE") {
      throw new ErrorApertura(`El curso ya fue revisado (${origen.estadoApertura}).`);
    }

    const inscripciones = await tx.inscripcion.findMany({
      where: { codigoCurso, estado: "INSCRITO" },
      select: {
        id: true,
        ciEstudiante: true,
        estudiante: { select: { usuario: { select: { nombres: true, apellidos: true } } } },
      },
    });
    if (inscripciones.length >= origen.cuposMin) {
      throw new ErrorApertura(
        `El curso alcanza el mínimo (${inscripciones.length} de ${origen.cuposMin}). Debes abrirlo.`,
      );
    }

    for (const ci of Object.keys(reasignaciones)) {
      if (!inscripciones.some((i) => i.ciEstudiante === ci)) {
        throw new ErrorApertura(`El estudiante ${ci} no está inscrito en este curso.`);
      }
    }

    // Valida los destinos y calcula cuantos cupos le quedan a cada uno.
    const destinos = new Map<string, { grupo: string; libres: number }>();
    if (destinosPedidos.size > 0) {
      const filas = await tx.curso.findMany({
        where: { codigo: { in: [...destinosPedidos] } },
        select: {
          codigo: true,
          grupo: true,
          codigoMateria: true,
          estado: true,
          estadoApertura: true,
          cuposMax: true,
          _count: { select: { inscripciones: { where: { estado: "INSCRITO" } } } },
        },
      });
      for (const codigo of destinosPedidos) {
        const fila = filas.find((f) => f.codigo === codigo);
        if (!fila) throw new ErrorApertura(`El grupo destino ${codigo} no existe.`);
        if (!origen.codigoMateria || fila.codigoMateria !== origen.codigoMateria) {
          throw new ErrorApertura(`El curso ${codigo} no es un grupo de la misma materia.`);
        }
        if (fila.estado !== "ACTIVO" || fila.estadoApertura === "CERRADO") {
          throw new ErrorApertura(`El grupo destino ${codigo} está cerrado.`);
        }
        destinos.set(codigo, {
          grupo: fila.grupo,
          libres: fila.cuposMax > 0 ? fila.cuposMax - fila._count.inscripciones : Infinity,
        });
      }
    }

    const sesionesOrigen = await tx.sesion.findMany({
      where: { codigoCurso },
      select: { id: true },
    });
    const idsSesionesOrigen = sesionesOrigen.map((s) => s.id);

    const movidos: ResultadoCierrePorCupo["movidos"] = [];
    const cancelados: ResultadoCierrePorCupo["cancelados"] = [];
    const nombreCurso = `${origen.nombre} (grupo ${origen.grupo})`;

    for (const inscripcion of inscripciones) {
      const ci = inscripcion.ciEstudiante;
      const nombre = `${inscripcion.estudiante.usuario.nombres} ${inscripcion.estudiante.usuario.apellidos}`;
      const codigoDestino = ci in reasignaciones ? reasignaciones[ci] : destinoPorDefecto;
      const destino = codigoDestino ? destinos.get(codigoDestino) : undefined;

      let motivo: string | null = null;
      if (!codigoDestino || !destino) {
        motivo = "No se eligió un grupo destino.";
      } else if (destino.libres <= 0) {
        motivo = `El grupo ${destino.grupo} no tiene cupos disponibles.`;
      } else {
        const previa = await tx.inscripcion.findUnique({
          where: { ciEstudiante_codigoCurso: { ciEstudiante: ci, codigoCurso: codigoDestino } },
          select: { estado: true },
        });
        if (previa) {
          motivo =
            previa.estado === "INSCRITO"
              ? `Ya estaba inscrito en el grupo ${destino.grupo}.`
              : `Tiene una inscripción cancelada en el grupo ${destino.grupo}.`;
        }
      }

      if (motivo === null && codigoDestino && destino) {
        // Mover la inscripcion conserva el pago y el tipo de precio.
        await tx.inscripcion.update({
          where: { id: inscripcion.id },
          data: { codigoCurso: codigoDestino },
        });
        if (idsSesionesOrigen.length > 0) {
          await tx.asistencia.deleteMany({
            where: { ciEstudiante: ci, idSesion: { in: idsSesionesOrigen } },
          });
        }
        await tx.curso.update({
          where: { codigo: codigoCurso },
          data: { numInscritos: { decrement: 1 } },
        });
        await tx.curso.update({
          where: { codigo: codigoDestino },
          data: { numInscritos: { increment: 1 } },
        });
        destino.libres -= 1;

        movidos.push({ ciEstudiante: ci, nombre, codigoDestino, grupoDestino: destino.grupo });
        await tx.notificacion.create({
          data: {
            ciUsuario: ci,
            codigoCurso: codigoDestino,
            titulo: `Cambio de grupo: ${origen.nombre}`,
            mensaje:
              `El curso ${nombreCurso} se cerró por no alcanzar el mínimo de inscritos. ` +
              `Fuiste movido al grupo ${destino.grupo} (${codigoDestino}).`,
          },
        });
      } else {
        await tx.inscripcion.update({
          where: { id: inscripcion.id },
          data: { estado: "CANCELADO" },
        });

        // Si ya estaba inscrito en el destino, en la practica ya tiene grupo.
        const yaTieneGrupo = motivo?.startsWith("Ya estaba inscrito") ?? false;
        cancelados.push({ ciEstudiante: ci, nombre, motivo: motivo ?? "" });
        await tx.notificacion.create({
          data: {
            ciUsuario: ci,
            codigoCurso,
            titulo: `Curso cerrado: ${origen.nombre}`,
            mensaje: yaTieneGrupo
              ? `El curso ${nombreCurso} se cerró por no alcanzar el mínimo de inscritos. ` +
                `Se canceló esta inscripción porque ya estás inscrito en el grupo ${destino?.grupo}.`
              : `El curso ${nombreCurso} se cerró por no alcanzar el mínimo de inscritos ` +
                `y tu inscripción fue cancelada. Comunícate con la administración para ver opciones.`,
          },
        });
      }
    }

    await tx.curso.update({
      where: { codigo: codigoCurso },
      data: { estadoApertura: "CERRADO" },
    });

    return { codigo: codigoCurso, movidos, cancelados };
  });

  // Igual que en registrarInscripcion: la asistencia del grupo nuevo se crea
  // despues de confirmar la transaccion.
  for (const movido of resultado.movidos) {
    await crearAsistenciasParaInscripcion(movido.ciEstudiante, movido.codigoDestino);
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export interface NotificacionDTO {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  codigoCurso: string | null;
}

export async function getNotificaciones(ciUsuario: string): Promise<NotificacionDTO[]> {
  const filas = await prisma.notificacion.findMany({
    where: { ciUsuario },
    orderBy: { fechaCreacion: "desc" },
    take: 50,
  });
  return filas.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    leida: n.leida,
    fecha: n.fechaCreacion.toISOString(),
    codigoCurso: n.codigoCurso,
  }));
}

/** Marca como leida una notificacion propia. Devuelve false si no existe o no es del usuario. */
export async function marcarNotificacionLeida(id: number, ciUsuario: string): Promise<boolean> {
  const { count } = await prisma.notificacion.updateMany({
    where: { id, ciUsuario },
    data: { leida: true },
  });
  return count > 0;
}
