import "server-only";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "@/src/lib/prisma";
import type { Rol } from "@/src/lib/auth";
import { ErrorAsistencia, MAX_AUSENCIAS_PERMITIDAS } from "@/src/lib/asistencia";

/** URL base del sitio para el código de verificación del QR. */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eva.umss.edu.bo";

export interface DatosCertificado {
  codigoVerificacion: string;
  tipo: string;
  notaFinal: number | null;
  pctAsistencia: number | null;
  fechaEmision: string | null;
  estudiante: { ci: string; nombres: string; apellidos: string; codigoSis: string };
  curso: {
    codigo: string;
    nombre: string;
    fechaIni: string;
    fechaFin: string;
    duracionHoras: number;
    instructor: string;
  };
  ambiente: string | null;
}

interface Usuario {
  ci: string;
  role: Rol;
}

function soloFecha(valor: Date): string {
  return valor.toISOString().slice(0, 10);
}

function formatFechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function validarUsuarioSesion(sesionCurso: { ciInstructor: string }, usuario: Usuario): void {
  if (usuario.role !== "ADMIN" && sesionCurso.ciInstructor !== usuario.ci) {
    throw new ErrorAsistencia("No tienes permiso sobre este curso.");
  }
}

/** Certificado público para la página de verificación (con nombre del instructor y ambiente del curso). */
export async function obtenerCertificadoParaVerificacion(
  codigoVerificacion: string,
): Promise<DatosCertificado | null> {
  const certificado = await prisma.certificado.findUnique({
    where: { codigoVerificacion },
    include: {
      estudiante: {
        include: { usuario: { select: { nombres: true, apellidos: true } } },
      },
      curso: {
        include: {
          instructor: {
            include: { usuario: { select: { nombres: true, apellidos: true } } },
          },
          sesiones: {
            orderBy: { fecha: "asc" },
            include: { ambiente: { select: { nombre: true } } },
          },
        },
      },
    },
  });

  if (!certificado) return null;

  const ambiente = certificado.curso.sesiones[0]?.ambiente?.nombre ?? null;

  return {
    codigoVerificacion: certificado.codigoVerificacion,
    tipo: certificado.tipo,
    notaFinal: certificado.notaFinal != null ? Number(certificado.notaFinal) : null,
    pctAsistencia:
      certificado.pctAsistencia != null ? Number(certificado.pctAsistencia) : null,
    fechaEmision: certificado.fechaEmision ? soloFecha(certificado.fechaEmision) : null,
    estudiante: {
      ci: certificado.estudiante.ci,
      nombres: certificado.estudiante.usuario.nombres,
      apellidos: certificado.estudiante.usuario.apellidos,
      codigoSis: certificado.estudiante.codigoSis,
    },
    curso: {
      codigo: certificado.curso.codigo,
      nombre: certificado.curso.nombre,
      fechaIni: soloFecha(certificado.curso.fechaIni),
      fechaFin: soloFecha(certificado.curso.fechaFin),
      duracionHoras: certificado.curso.duracionHoras,
      instructor: `${certificado.curso.instructor.usuario.nombres} ${certificado.curso.instructor.usuario.apellidos}`,
    },
    ambiente,
  };
}

/** Genera el PDF del certificado con pdfkit y QR de verificación. */
export async function generarPDFCertificado(datos: DatosCertificado): Promise<Buffer> {
  const urlVerificacion = `${BASE_URL}/certificado/${datos.codigoVerificacion}`;
  const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
    margin: 0,
    width: 120,
    errorCorrectionLevel: "M",
  });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBuffer = Buffer.from(qrBase64, "base64");

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const ancho = doc.page.width;
  const alto = doc.page.height;
  const centro = ancho / 2;

  // Borde decorativo
  doc.rect(15, 15, ancho - 30, alto - 30).lineWidth(2).stroke("#114477");
  doc.rect(23, 23, ancho - 46, alto - 46).lineWidth(0.5).stroke("#C41E2F");

  // Encabezado institucional
  doc
    .fillColor("#114477")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("UNIVERSIDAD MAYOR DE SAN SIMÓN", 40, 50, { align: "center", width: ancho - 80, lineBreak: false });
  doc
    .fillColor("#4B5563")
    .font("Helvetica")
    .fontSize(11)
    .text("Facultad de Ciencias y Tecnología — Carrera de Informática", 40, 73, {
      align: "center",
      width: ancho - 80,
      lineBreak: false,
    });
  doc.text("Laboratorios de Sistemas e Informática", 40, 90, {
    align: "center",
    width: ancho - 80,
    lineBreak: false,
  });

  // Título del certificado
  const esAprobado = datos.tipo === "APROBADO";
  doc
    .fillColor("#114477")
    .font("Helvetica-Bold")
    .fontSize(30)
    .text(esAprobado ? "Certificado de Aprobación" : "Certificado de Asistencia", 40, 122, {
      align: "center",
      width: ancho - 80,
      lineBreak: false,
    });

  // Línea decorativa
  doc
    .moveTo(centro - 120, 165)
    .lineTo(centro + 120, 165)
    .lineWidth(1.5)
    .stroke("#C41E2F");

  // Cuerpo
  doc
    .fillColor("#2D2D2D")
    .font("Helvetica")
    .fontSize(13)
    .text("Se certifica que:", 40, 182, { align: "center", width: ancho - 80, lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#114477")
    .text(`${datos.estudiante.nombres} ${datos.estudiante.apellidos}`, 40, 205, {
      align: "center",
      width: ancho - 80,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#2D2D2D")
    .text(`C.I. ${datos.estudiante.ci} — SIS ${datos.estudiante.codigoSis}`, 40, 238, {
      align: "center",
      width: ancho - 80,
      lineBreak: false,
    });

  doc
    .fontSize(13)
    .text("Por haber completado satisfactoriamente el curso intensivo de:", 60, 268, {
      align: "center",
      width: ancho - 120,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(datos.curso.nombre, 60, 292, { align: "center", width: ancho - 120, lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#4B5563")
    .text(
      `Realizado en ${datos.ambiente ?? "los ambientes de la carrera"}, del ${formatFechaLarga(datos.curso.fechaIni)} al ${formatFechaLarga(datos.curso.fechaFin)}, con una duración de ${datos.curso.duracionHoras} horas académicas.`,
      80,
      325,
      { align: "center", width: ancho - 160 },
    );

  // QR de verificación
  doc.image(qrBuffer, centro - 45, 365, { width: 90, height: 90 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#4B5563")
    .text("Verificar en:", centro - 80, 458, { align: "center", width: 160, lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#114477")
    .text(urlVerificacion, centro - 110, 470, { align: "center", width: 220, lineBreak: false });

  // Firmas (3 líneas)
  const firmas = [
    { titulo: "Instructor", nombre: datos.curso.instructor },
    { titulo: "Director Académico", nombre: "" },
    { titulo: "Decano", nombre: "" },
  ];
  const yFirma = 492;
  const anchoFirma = (ancho - 160) / 3;

  firmas.forEach((firma, indice) => {
    const x = 80 + indice * anchoFirma;
    doc
      .moveTo(x + 20, yFirma)
      .lineTo(x + anchoFirma - 40, yFirma)
      .lineWidth(0.8)
      .stroke("#2D2D2D");
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#2D2D2D")
      .text(firma.nombre || " ", x + 20, yFirma + 8, {
        align: "center",
        width: anchoFirma - 60,
        lineBreak: false,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(firma.titulo, x + 20, yFirma + 22, {
        align: "center",
        width: anchoFirma - 60,
        lineBreak: false,
      });
  });

  // Pie: código de verificación y fecha de emisión
  const pieY = 538;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4B5563")
    .text(
      `Código de verificación: ${datos.codigoVerificacion}`,
      50,
      pieY,
      { align: "left", width: ancho / 2 - 50 },
    );
  if (datos.fechaEmision) {
    doc.text(
      `Fecha de emisión: ${formatFechaLarga(datos.fechaEmision)}`,
      ancho / 2,
      pieY,
      { align: "right", width: ancho / 2 - 50 },
    );
  }

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export interface ResultadoEmision {
  emitidos: number;
  omitidos: { ci: string; motivo: string }[];
  pendientes: number;
}

/**
 * Emite (finaliza) los certificados PENDIENTE de un curso:
 * tipo = APROBADO (nota >= 70) o ASISTENCIA (nota < 70), solo si el estudiante es elegible por asistencia.
 */
export async function finalizarCertificados(
  codigoCurso: string,
  usuario: Usuario,
): Promise<ResultadoEmision> {
  const curso = await prisma.curso.findUnique({
    where: { codigo: codigoCurso },
    select: { ciInstructor: true, codigo: true, estado: true },
  });
  if (!curso) throw new ErrorAsistencia("El curso no existe.");
  validarUsuarioSesion(curso, usuario);

  if (curso.estado !== "CERRADO") {
    throw new ErrorAsistencia(
      "El curso debe estar cerrado para emitir certificados.",
    );
  }

  const pendientes = await prisma.certificado.findMany({
    where: { codigoCurso, tipo: "PENDIENTE", notaFinal: { not: null } },
    select: { ciEstudiante: true, notaFinal: true },
  });

  if (pendientes.length === 0) {
    throw new ErrorAsistencia("No hay certificados pendientes de emitir en este curso.");
  }

  const [totalSesiones, agrupado] = await Promise.all([
    prisma.sesion.count({ where: { codigoCurso } }),
    prisma.asistencia.groupBy({
      by: ["ciEstudiante", "estado"],
      _count: { _all: true },
      where: { sesion: { codigoCurso } },
    }),
  ]);

  const porEstudiante = new Map<string, Record<string, number>>();
  for (const fila of agrupado) {
    const actual = porEstudiante.get(fila.ciEstudiante) ?? {};
    actual[fila.estado] = fila._count._all;
    porEstudiante.set(fila.ciEstudiante, actual);
  }

  const omitidos: { ci: string; motivo: string }[] = [];
  const aEmitir: { ci: string; nota: number; tipo: string; pct: number }[] = [];

  for (const pendiente of pendientes) {
    const ci = pendiente.ciEstudiante;
    const conteo = porEstudiante.get(ci) ?? {};
    const presentes = conteo.PRESENTE ?? 0;
    const justificadas = conteo.JUSTIFICADA ?? 0;
    const asistentes = presentes + justificadas;
    const ausentes = Math.max(0, totalSesiones - asistentes);
    const pctAsistencia =
      totalSesiones > 0 ? Math.round((asistentes / totalSesiones) * 10000) / 100 : 0;

    if (ausentes > MAX_AUSENCIAS_PERMITIDAS) {
      omitidos.push({
        ci,
        motivo: `Supera el máximo de ${MAX_AUSENCIAS_PERMITIDAS} ausencias (${ausentes}).`,
      });
      continue;
    }

    const nota = Number(pendiente.notaFinal);
    const tipo = nota >= 70 ? "APROBADO" : "ASISTENCIA";
    aEmitir.push({ ci, nota, tipo, pct: pctAsistencia });
  }

  if (aEmitir.length > 0) {
    await prisma.$transaction(
      aEmitir.map((emision) =>
        prisma.certificado.update({
          where: { ciEstudiante_codigoCurso: { ciEstudiante: emision.ci, codigoCurso } },
          data: {
            tipo: emision.tipo,
            pctAsistencia: emision.pct,
            fechaEmision: new Date(),
          },
        }),
      ),
    );
  }

  const restantes = await prisma.certificado.count({
    where: { codigoCurso, tipo: "PENDIENTE" },
  });

  return { emitidos: aEmitir.length, omitidos, pendientes: restantes };
}
