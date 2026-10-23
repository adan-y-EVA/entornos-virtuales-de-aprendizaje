import { prisma } from "../../../lib/prisma";

export interface CursoInput {
  codigo: string;
  ciInstructor: string;
  nombre: string;
  grupo: string;
  nivel: string;
  costoExterno: number;
  costoUmss: number;
  costoAuxiliar: number;
  fechaIni: string;
  fechaFin: string;
  duracionHoras: number;
  cuposMax: number;
  cuposMin?: number;
  fechaLimiteInscripcion?: string | null;
  codigoMateria?: string | null;
}

export class ErrorValidacionCurso extends Error {}

/** Campos de apertura (minimo, fecha limite, materia) normalizados y validados. */
function camposApertura(data: CursoInput) {
  const cuposMin = Number(data.cuposMin ?? 0);
  const cuposMax = Number(data.cuposMax ?? 0);
  if (!Number.isInteger(cuposMin) || cuposMin < 0) {
    throw new ErrorValidacionCurso("El mínimo de inscritos debe ser un entero no negativo.");
  }
  if (cuposMax > 0 && cuposMin > cuposMax) {
    throw new ErrorValidacionCurso("El mínimo de inscritos no puede superar el cupo máximo.");
  }

  const fechaLimite = data.fechaLimiteInscripcion?.trim() || null;
  if (fechaLimite && fechaLimite > data.fechaIni) {
    throw new ErrorValidacionCurso("La fecha límite de inscripción no puede ser posterior al inicio.");
  }

  return {
    cuposMin,
    fechaLimiteInscripcion: fechaLimite ? new Date(fechaLimite) : null,
    // Sin materia explicita, el curso es su propia materia (sin otros grupos).
    codigoMateria: data.codigoMateria?.trim().toUpperCase() || data.codigo,
  };
}

export const CursoService = {
  getAll: async () => {
    return await prisma.curso.findMany({
      orderBy: { fechaIni: 'desc' },
      include: {
        instructor: {
          include: { usuario: { select: { nombres: true, apellidos: true } } }
        }
      }
    });
  },

  getByCodigo: async (codigo: string) => {
    const curso = await prisma.curso.findUnique({
      where: { codigo },
      include: {
        instructor: {
          include: { usuario: { select: { nombres: true, apellidos: true, email: true } } }
        },
        inscripciones: {
          orderBy: { fechaInscripcion: 'desc' },
          include: {
            estudiante: {
              include: { usuario: { select: { nombres: true, apellidos: true } } }
            },
            pago: true
          }
        }
      }
    });

    if (!curso) return null;

    return {
      codigo: curso.codigo,
      nombre: curso.nombre,
      grupo: curso.grupo,
      nivel: curso.nivel,
      estado: curso.estado,
      moneda: curso.moneda,
      costoExterno: Number(curso.costoExterno),
      costoUmss: Number(curso.costoUmss),
      costoAuxiliar: Number(curso.costoAuxiliar),
      fechaIni: curso.fechaIni.toISOString().slice(0, 10),
      fechaFin: curso.fechaFin.toISOString().slice(0, 10),
      duracionHoras: curso.duracionHoras,
      cuposMax: curso.cuposMax,
      cuposMin: curso.cuposMin,
      fechaLimiteInscripcion: (curso.fechaLimiteInscripcion ?? curso.fechaIni).toISOString().slice(0, 10),
      codigoMateria: curso.codigoMateria,
      estadoApertura: curso.estadoApertura,
      inscritos: curso.inscripciones.filter((i) => i.estado === 'INSCRITO').length,
      instructor: {
        ci: curso.instructor.ci,
        nombre: `${curso.instructor.usuario.nombres} ${curso.instructor.usuario.apellidos}`,
        email: curso.instructor.usuario.email,
        especialidad: curso.instructor.especialidad
      },
      inscripciones: curso.inscripciones.map((i) => ({
        id: i.id,
        ciEstudiante: i.ciEstudiante,
        codigoSis: i.estudiante.codigoSis,
        nombre: `${i.estudiante.usuario.nombres} ${i.estudiante.usuario.apellidos}`,
        tipoPrecio: i.tipoPrecio,
        estado: i.estado,
        estadoPago: i.estadoPago,
        montoPagado: i.pago ? Number(i.pago.montoFisico) + Number(i.pago.montoQr) : 0,
        fechaInscripcion: i.fechaInscripcion.toISOString().slice(0, 10)
      }))
    };
  },

  create: async (data: CursoInput) => {
    return await prisma.curso.create({
      data: {
        codigo: data.codigo,
        ciInstructor: data.ciInstructor,
        nombre: data.nombre,
        grupo: data.grupo,
        nivel: data.nivel,
        costoExterno: data.costoExterno,
        costoUmss: data.costoUmss,
        costoAuxiliar: data.costoAuxiliar,
        fechaIni: new Date(data.fechaIni),
        fechaFin: new Date(data.fechaFin),
        duracionHoras: data.duracionHoras,
        cuposMax: data.cuposMax,
        ...camposApertura(data),
        estado: 'ACTIVO'
      }
    });
  },

  update: async (codigo: string, data: CursoInput) => {
    const apertura = camposApertura({ ...data, codigo });
    return await prisma.curso.update({
      where: { codigo },
      data: {
        ciInstructor: data.ciInstructor,
        nombre: data.nombre,
        grupo: data.grupo,
        nivel: data.nivel,
        costoExterno: data.costoExterno,
        costoUmss: data.costoUmss,
        costoAuxiliar: data.costoAuxiliar,
        fechaIni: new Date(data.fechaIni),
        fechaFin: new Date(data.fechaFin),
        duracionHoras: data.duracionHoras,
        cuposMax: data.cuposMax,
        ...apertura,
      }
    });
  },

  toggleEstado: async (codigo: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'CERRADO' : 'ACTIVO';
    return await prisma.curso.update({
      where: { codigo },
      data: { estado: nuevoEstado }
    });
  }
};