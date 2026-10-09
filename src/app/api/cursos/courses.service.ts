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
        estado: 'activo'
      }
    });
  },

  update: async (codigo: string, data: CursoInput) => {
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
      }
    });
  },

  toggleEstado: async (codigo: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'archivado' : 'activo';
    return await prisma.curso.update({
      where: { codigo },
      data: { estado: nuevoEstado }
    });
  }
};