import React from "react";
import { notFound } from "next/navigation";
import { CheckCircle, XCircle, Download, Award, Calendar, Clock, MapPin } from "lucide-react";
import { obtenerCertificadoParaVerificacion } from "@/src/lib/certificados";

export const dynamic = "force-dynamic";

function formatFechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PaginaVerificacionCertificado({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const certificado = await obtenerCertificadoParaVerificacion(codigo);

  if (!certificado) {
    notFound();
  }

  const esEmitido = certificado.tipo === "APROBADO" || certificado.tipo === "ASISTENCIA";
  const esAprobado = certificado.tipo === "APROBADO";

  return (
    <div className="min-h-screen bg-card-bg flex items-center justify-center p-4">
      <div className="bg-white border border-card-border rounded-xl shadow-sm w-full max-w-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="bg-primary text-white p-6 text-center">
          <h1 className="text-xl font-primary font-bold">
            Verificación de Certificado
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Laboratorios de Sistemas e Informática — UMSS
          </p>
        </div>

        {/* Estado */}
        <div
          className={`p-6 flex items-center gap-3 border-b border-card-border ${
            esEmitido
              ? "bg-green-50 text-green-800"
              : "bg-yellow-50 text-yellow-800"
          }`}
        >
          {esEmitido ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <div>
            <p className="font-bold">
              {esEmitido
                ? esAprobado
                  ? "Certificado válido — Aprobado"
                  : "Certificado válido — Asistencia"
                : "Certificado no emitido"}
            </p>
            <p className="text-sm">
              {esEmitido
                ? "Este certificado fue emitido oficialmente y es verificable."
                : "El certificado está pendiente de emisión."}
            </p>
          </div>
        </div>

        {/* Detalles */}
        <div className="p-6 space-y-4 font-secondary text-sm">
          <div>
            <p className="text-text-muted text-xs uppercase font-semibold">
              Otorgado a
            </p>
            <p className="text-lg font-bold text-text-main font-primary">
              {certificado.estudiante.nombres} {certificado.estudiante.apellidos}
            </p>
            <p className="text-text-muted text-xs">
              CI: {certificado.estudiante.ci} &middot; SIS: {certificado.estudiante.codigoSis}
            </p>
          </div>

          <div>
            <p className="text-text-muted text-xs uppercase font-semibold">
              Curso completado
            </p>
            <p className="font-bold text-text-main">{certificado.curso.nombre}</p>
            <p className="text-text-muted text-xs">{certificado.curso.codigo}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-text-main">
              <Calendar size={14} className="text-primary" />
              <span className="text-xs">
                {formatFechaLarga(certificado.curso.fechaIni)} —{" "}
                {formatFechaLarga(certificado.curso.fechaFin)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-main">
              <Clock size={14} className="text-primary" />
              <span className="text-xs">{certificado.curso.duracionHoras} horas académicas</span>
            </div>
            <div className="flex items-center gap-2 text-text-main">
              <MapPin size={14} className="text-primary" />
              <span className="text-xs">{certificado.ambiente ?? "Ambiente por asignar"}</span>
            </div>
          </div>

          {/* Nota / asistencia / emisión */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-card-border">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-bg text-text-main text-xs font-semibold">
              <Award size={14} className="text-primary" />
              {certificado.tipo === "APROBADO" ? "Aprobado" : "Asistencia"}
            </span>
            {certificado.notaFinal != null && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold">
                Nota: {certificado.notaFinal}
              </span>
            )}
            {certificado.pctAsistencia != null && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-semibold">
                Asistencia: {certificado.pctAsistencia}%
              </span>
            )}
            {certificado.fechaEmision && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-card-bg text-text-muted text-xs font-semibold">
                Emitido: {formatFechaLarga(certificado.fechaEmision)}
              </span>
            )}
          </div>

          {/* Código + descarga */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-card-border">
            <p className="text-text-muted text-xs font-mono">
              Código: {certificado.codigoVerificacion}
            </p>
            {esEmitido && (
              <a
                href={`/api/asistencia/certificado/${certificado.codigoVerificacion}/pdf`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-opacity-90 transition-colors"
              >
                <Download size={16} /> Descargar PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
