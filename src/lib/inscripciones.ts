import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { ESTADOS_PAGO, esEstadoPago, type EstadoPago } from "@/src/lib/estados-pago";
import { hashPassword } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export const COL = {
  ci: "ciEstudiante",
  nombres: "nombresEstudiante",
  apellidos: "apellidosEstudiante",
  tipoPrecio: "tipoPrecio",
  codigoSis: "codigoSis",
  email: "email",
  celular: "celular",
  codigoCurso: "codigoCurso",
  cupos: "cuposMax",
  fechaInicio: "fechaIni",
  montoPagado: "montoPagado",
} as const;

export const COLUMNAS_REQUERIDAS = [
  COL.ci,
  COL.nombres,
  COL.apellidos,
  COL.tipoPrecio,
] as const;

export interface ErrorValidacion {
  columna: string;
  mensaje: string;
}

export class ErrorInscripcion extends Error {
  readonly columna: string;

  constructor(columna: string, mensaje: string) {
    super(mensaje);
    this.columna = columna;
  }
}

export interface DatosInscripcion {
  ciEstudiante: string;
  codigoCurso: string;
  tipoPrecio: string;
  estadoPago?: string;
  montoFisico?: number | string;
  montoQr?: number | string;
  nombres: string;
  apellidos: string;
  email?: string;
  celular?: string;
  codigoSis?: string;
  fotocopiaCi?: boolean;
}

export interface ResultadoInscripcion {
  idInscripcion: number;
  ciEstudiante: string;
  codigoSis: string;
  nombres: string;
  apellidos: string;
  estudianteNuevo: boolean;
  estadoPago: EstadoPago;
}

type CursoRow = {
  codigo: string;
  cupos_max: number;
  fecha_ini: string;
};

function hoyLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export interface CursoParaInscripcion {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  cuposMax: number;
  inscritos: number;
  abiertos: boolean;
  costos: { EXTERNO: number; UMSS: number; AUXILIAR: number };
}

export async function obtenerCurso(
  codigoCurso: string,
): Promise<CursoParaInscripcion | null> {
  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: {
      codigo: true,
      nombre: true,
      grupo: true,
      nivel: true,
      cuposMax: true,
      numInscritos: true,
      fechaIni: true,
      costoExterno: true,
      costoUmss: true,
      costoAuxiliar: true,
    },
  });

  if (!curso) return null;

  const inscritos = await prisma.inscripcion.count({
    where: { codigoCurso: curso.codigo, estado: "INSCRITO" },
  });

  return {
    codigo: curso.codigo,
    nombre: curso.nombre,
    grupo: curso.grupo,
    nivel: curso.nivel,
    cuposMax: curso.cuposMax,
    inscritos,
    fechaIni: curso.fechaIni.toISOString().slice(0, 10),
    abiertos: hoyLocal() <= curso.fechaIni.toISOString().slice(0, 10),
    costos: {
      EXTERNO: Number(curso.costoExterno),
      UMSS: Number(curso.costoUmss),
      AUXILIAR: Number(curso.costoAuxiliar),
    },
  };
}

function normalizar(valor: string | undefined): string {
  return (valor ?? "").trim();
}

export function parsearMonto(valor: unknown): { monto: number; error?: string } {
  if (valor === undefined || valor === null || String(valor).trim() === "") {
    return { monto: 0 };
  }

  const texto = String(valor).trim();
  const monto = Number(texto);

  if (!Number.isFinite(monto)) {
    return { monto: 0, error: `El monto "${texto}" no es un número válido.` };
  }

  if (monto < 0) {
    return { monto: 0, error: "El monto no puede ser negativo." };
  }

  return { monto };
}

export function validarCamposFormulario(
  datos: Partial<Record<keyof DatosInscripcion, unknown>>,
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  const ci = normalizar(datos.ciEstudiante as string);
  const nombres = normalizar(datos.nombres as string);
  const apellidos = normalizar(datos.apellidos as string);
  const tipoPrecio = normalizar(datos.tipoPrecio as string).toUpperCase();
  const email = normalizar(datos.email as string);
  const celular = normalizar(datos.celular as string);
  const codigoSis = normalizar(datos.codigoSis as string);

  if (!ci) errores.push({ columna: COL.ci, mensaje: "El CI es obligatorio." });
  else if (ci.length > 10)
    errores.push({ columna: COL.ci, mensaje: "El CI supera los 10 caracteres." });

  if (!nombres)
    errores.push({ columna: COL.nombres, mensaje: "Los nombres son obligatorios." });
  else if (nombres.length > 80)
    errores.push({ columna: COL.nombres, mensaje: "Los nombres superan los 80 caracteres." });

  if (!apellidos)
    errores.push({
      columna: COL.apellidos,
      mensaje: "Los apellidos son obligatorios.",
    });
  else if (apellidos.length > 80)
    errores.push({
      columna: COL.apellidos,
      mensaje: "Los apellidos superan los 80 caracteres.",
    });

  if (!tipoPrecio)
    errores.push({
      columna: COL.tipoPrecio,
      mensaje: "El tipo de estudiante es obligatorio (valores usados: EXTERNO, UMSS, AUXILIAR).",
    });
  else if (tipoPrecio.length > 30)
    errores.push({
      columna: COL.tipoPrecio,
      mensaje: "El tipo de precio supera los 30 caracteres.",
    });

  if (email) {
    if (email.length > 120)
      errores.push({ columna: COL.email, mensaje: "El correo supera los 120 caracteres." });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errores.push({ columna: COL.email, mensaje: "El correo no tiene un formato válido." });
  }

  if (celular && celular.length > 20)
    errores.push({ columna: COL.celular, mensaje: "El celular supera los 20 caracteres." });

  if (codigoSis && codigoSis.length > 20)
    errores.push({
      columna: COL.codigoSis,
      mensaje: "El código SIS supera los 20 caracteres.",
    });

  const estadoPago = normalizar(datos.estadoPago as string).toUpperCase();
  const fisico = parsearMonto(datos.montoFisico);
  const qr = parsearMonto(datos.montoQr);

  if (fisico.error) errores.push({ columna: "montoFisico", mensaje: fisico.error });
  if (qr.error) errores.push({ columna: "montoQr", mensaje: qr.error });

  if (!fisico.error && !qr.error) {
    const totalPagado = fisico.monto + qr.monto;

    if (!estadoPago) {
      if (totalPagado > 0)
        errores.push({
          columna: "estadoPago",
          mensaje: "Debes indicar el estado de pago cuando se registra un monto.",
        });
    } else if (!esEstadoPago(estadoPago)) {
      errores.push({
        columna: "estadoPago",
        mensaje: `El estado de pago no es válido (valores usados: ${ESTADOS_PAGO.join(", ")}).`,
      });
    } else if (estadoPago === "PENDIENTE" && totalPagado > 0) {
      errores.push({
        columna: "estadoPago",
        mensaje: "Si el estado de pago es PENDIENTE, los montos deben ser 0.",
      });
    } else if (estadoPago === "PARCIAL" && totalPagado <= 0) {
      errores.push({
        columna: "estadoPago",
        mensaje: "Si el estado de pago es PARCIAL, debes registrar un monto mayor a 0.",
      });
    }
  }

  return errores;
}

async function asegurarEstudiante(
  tx: Prisma.TransactionClient,
  datos: DatosInscripcion,
): Promise<{ codigoSis: string; estudianteNuevo: boolean }> {
  const ci = datos.ciEstudiante;
  const codigoSis = datos.codigoSis || `SIS-${ci}`;

  const existente = await tx.usuario.findUnique({
    where: { ci },
    include: { estudiante: true, instructor: true },
  });

  if (existente?.instructor) {
    throw new ErrorInscripcion(
      COL.ci,
      `El CI ${ci} pertenece a un instructor, no a un estudiante.`,
    );
  }

  if (!existente) {
    await tx.usuario.create({
      data: {
        ci,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        email: datos.email || `sin-correo-${ci}@placeholder.local`,
        passwordHash: hashPassword(randomBytes(32).toString("hex")),
      },
    });
  } else if (
    existente.nombres !== datos.nombres ||
    existente.apellidos !== datos.apellidos ||
    (datos.email && existente.email !== datos.email)
  ) {
    await tx.usuario.update({
      where: { ci },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        ...(datos.email ? { email: datos.email } : {}),
      },
    });
  }

  if (!existente?.estudiante) {
    await tx.estudiante.create({
      data: {
        ci,
        codigoSis,
        celular: datos.celular || "0",
      },
    });
    return { codigoSis, estudianteNuevo: true };
  }

  return { codigoSis: existente.estudiante.codigoSis, estudianteNuevo: false };
}

export async function registrarInscripcion(
  datos: DatosInscripcion,
): Promise<ResultadoInscripcion> {
  const errores = validarCamposFormulario(datos);
  if (errores.length > 0) {
    throw new ErrorInscripcion(errores[0].columna, errores[0].mensaje);
  }

  const ciEstudiante = datos.ciEstudiante.trim();
  const tipoPrecio = datos.tipoPrecio.trim().toUpperCase();
  const estadoPagoCrudo = normalizar(datos.estadoPago).toUpperCase() || "PENDIENTE";
  const estadoPago = esEstadoPago(estadoPagoCrudo) ? estadoPagoCrudo : "PENDIENTE";
  const montoFisico = parsearMonto(datos.montoFisico).monto;
  const montoQr = parsearMonto(datos.montoQr).monto;

  try {
    return await prisma.$transaction(async (tx) => {
      const cursos = await tx.$queryRaw<CursoRow[]>`
        SELECT codigo, cupos_max, fecha_ini::text AS fecha_ini
        FROM curso
        WHERE codigo = ${datos.codigoCurso}
        FOR UPDATE
      `;

      const curso = cursos[0];
      if (!curso) {
        throw new ErrorInscripcion(
          COL.codigoCurso,
          `El curso ${datos.codigoCurso} no existe.`,
        );
      }

      const hoy = hoyLocal();
      if (hoy > curso.fecha_ini) {
        throw new ErrorInscripcion(
          COL.fechaInicio,
          `La inscripción al curso ${curso.codigo} se cerró: la fecha de inicio (${curso.fecha_ini}) ya pasó.`,
        );
      }

      const inscritos = await tx.inscripcion.count({
        where: { codigoCurso: curso.codigo, estado: "INSCRITO" },
      });

      if (curso.cupos_max > 0 && inscritos >= curso.cupos_max) {
        throw new ErrorInscripcion(
          COL.cupos,
          `El curso ${curso.codigo} alcanzó su cupo máximo (${curso.cupos_max}).`,
        );
      }

      const previa = await tx.inscripcion.findUnique({
        where: {
          ciEstudiante_codigoCurso: {
            ciEstudiante,
            codigoCurso: curso.codigo,
          },
        },
        select: { estado: true },
      });

      if (previa) {
        throw new ErrorInscripcion(
          COL.ci,
          previa.estado === "CANCELADO"
            ? `El estudiante ${ciEstudiante} ya tiene una inscripción CANCELADA en el curso ${curso.codigo}.`
            : `El estudiante ${ciEstudiante} ya está inscrito en el curso ${curso.codigo}.`,
        );
      }

      const estudiante = await asegurarEstudiante(tx, { ...datos, ciEstudiante });

      const inscripcion = await tx.inscripcion.create({
        data: {
          ciEstudiante,
          codigoCurso: curso.codigo,
          tipoPrecio,
          estadoPago,
          fotocopiaCi: datos.fotocopiaCi ?? false,
          estado: "INSCRITO",
        },
      });

      if (montoFisico + montoQr > 0) {
        await tx.pago.create({
          data: {
            idInscripcion: inscripcion.id,
            montoFisico,
            montoQr,
          },
        });
      }

      await tx.curso.update({
        where: { codigo: curso.codigo },
        data: { numInscritos: { increment: 1 } },
      });

      return {
        idInscripcion: inscripcion.id,
        ciEstudiante,
        codigoSis: estudiante.codigoSis,
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        estudianteNuevo: estudiante.estudianteNuevo,
        estadoPago,
      };
    });
  } catch (error) {
    if (error instanceof ErrorInscripcion) throw error;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const detalle = `${JSON.stringify(error.meta?.target ?? "")} ${error.message}`;
        if (/email/i.test(detalle)) {
          throw new ErrorInscripcion(
            COL.email,
            "El correo ya está registrado en otro usuario.",
          );
        }
        if (/codigo_?sis/i.test(detalle)) {
          throw new ErrorInscripcion(
            COL.codigoSis,
            "El código SIS ya pertenece a otro estudiante.",
          );
        }
        throw new ErrorInscripcion(
          COL.ci,
          "El estudiante ya se encuentra inscrito en este curso.",
        );
      }
      if (error.code === "P2025") {
        throw new ErrorInscripcion(
          COL.codigoCurso,
          `El curso ${datos.codigoCurso} no existe.`,
        );
      }
    }

    throw error;
  }
}
