import { prisma } from "../../../lib/prisma";

export interface CursoInput {
  codigo: string;
  ciInstructor: string;
  nombre: string;
  grupo: string;
  nivel: string;
  costo: number;
  fechaIni: string;
  fechaFin: string;
  duracionHoras: number;
}

export const CursoService = {
  getAll: async () => {
    return await prisma.curso.findMany({
      orderBy: { fechaIni: 'desc' }
    });
  },

  create: async (data: CursoInput) => {
    return await prisma.curso.create({
      data: {
        codigo: data.codigo,
        ciInstructor: data.ciInstructor,
        nombre: data.nombre,
        grupo: data.grupo,
        nivel: data.nivel,
        costo: data.costo,
        fechaIni: new Date(data.fechaIni),
        fechaFin: new Date(data.fechaFin),
        duracionHoras: data.duracionHoras,
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
        costo: data.costo,
        fechaIni: new Date(data.fechaIni),
        fechaFin: new Date(data.fechaFin),
        duracionHoras: data.duracionHoras,
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