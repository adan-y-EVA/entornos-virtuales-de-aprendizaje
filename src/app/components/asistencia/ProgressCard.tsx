'use client';

import React from 'react';
import { Calendar, CheckCircle, GraduationCap, User } from 'lucide-react';
import { formatFecha, type ProgresoCurso } from './types';

function BadgeCertificado({ curso }: { curso: ProgresoCurso }) {
  if (!curso.elegibleCertificado) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        No elegible
      </span>
    );
  }
  if (curso.tipoCertificado === 'APROBADO') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        Aprobado
      </span>
    );
  }
  if (curso.tipoCertificado === 'ASISTENCIA') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        Certificado de asistencia
      </span>
    );
  }
  if (curso.notaFinal !== null) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-card-bg text-text-muted border border-input-border">
        Certificado pendiente
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
      Pendiente de nota
    </span>
  );
}

export function ProgressCard({ curso }: { curso: ProgresoCurso }) {
  const colorBarra = !curso.elegibleCertificado
    ? 'bg-red-500'
    : curso.pctAsistencia >= 70
      ? 'bg-green-500'
      : 'bg-yellow-500';

  return (
    <div className="bg-white border border-card-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
      {/* Encabezado */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-primary font-bold text-text-main leading-tight">{curso.nombre}</h3>
          <p className="text-text-muted text-xs mt-1">
            {curso.codigo} &middot; Nivel {curso.nivel} &middot; Grupo {curso.grupo}
          </p>
        </div>
        <BadgeCertificado curso={curso} />
      </div>

      <p className="text-text-muted text-xs flex items-center gap-1.5">
        <User size={12} /> {curso.instructor}
      </p>

      {/* Barra de asistencia */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
            <CheckCircle size={12} /> Asistencia
          </span>
          <span className="text-sm font-bold text-text-main">{curso.pctAsistencia}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-card-bg overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${colorBarra}`}
            style={{ width: `${curso.pctAsistencia}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">
          {curso.presentes + curso.justificadas} de {curso.totalSesiones} sesiones asistidas
        </p>
      </div>

      {/* Desglose P / J / A */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-green-50">
          <p className="text-sm font-bold text-green-700">{curso.presentes}</p>
          <p className="text-[10px] text-green-700 font-semibold uppercase">Presentes</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-50">
          <p className="text-sm font-bold text-yellow-700">{curso.justificadas}</p>
          <p className="text-[10px] text-yellow-700 font-semibold uppercase">Justificadas</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <p className="text-sm font-bold text-red-700">{curso.ausentes}</p>
          <p className="text-[10px] text-red-700 font-semibold uppercase">Ausentes</p>
        </div>
      </div>

      {!curso.elegibleCertificado && (
        <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-2">
          Supera el máximo de 3 ausencias: no puede obtener certificado.
        </p>
      )}

      {/* Pie: fechas, nota, código */}
      <div className="border-t border-card-border pt-3 flex justify-between items-end gap-2">
        <div className="text-text-muted text-xs space-y-1">
          <p className="flex items-center gap-1.5">
            <Calendar size={12} /> {formatFecha(curso.fechaIni)} - {formatFecha(curso.fechaFin)}
          </p>
          <p className="flex items-center gap-1.5">
            <GraduationCap size={12} />
            {curso.notaFinal !== null ? `Nota final: ${curso.notaFinal}` : 'Nota: pendiente'}
          </p>
        </div>
        {curso.codigoVerificacion && (
          <span className="text-[10px] text-text-muted font-mono">
            Cod: {curso.codigoVerificacion}
          </span>
        )}
      </div>
    </div>
  );
}
