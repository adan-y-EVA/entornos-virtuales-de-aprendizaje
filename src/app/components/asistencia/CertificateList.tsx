'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';

interface EstudianteCert {
  ci: string;
  nombres: string;
  apellidos: string;
  notaFinal: number | null;
  pctAsistencia: number;
  elegibleCertificado: boolean;
  tipoCertificado: string | null;
  codigoVerificacion: string | null;
}

interface ResultadoEmision {
  emitidos: number;
  omitidos: { ci: string; motivo: string }[];
  pendientes: number;
}

function BadgeEstado({ tipo }: { tipo: string | null }) {
  if (tipo === 'APROBADO') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        Aprobado
      </span>
    );
  }
  if (tipo === 'ASISTENCIA') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        Asistencia
      </span>
    );
  }
  if (tipo === 'PENDIENTE') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        Pendiente
      </span>
    );
  }
  return (
    <span className="text-xs text-text-muted italic">Sin nota</span>
  );
}

export function CertificateList({ codigoCurso }: { codigoCurso: string }) {
  const [estudiantes, setEstudiantes] = useState<EstudianteCert[]>([]);
  const [cargando, setCargando] = useState(true);
  const { call, loading } = useApi();

  const recargar = useCallback(async () => {
    const res = await call<EstudianteCert[]>(
      `/api/asistencia/curso/${codigoCurso}/stats`,
    );
    if (res?.ok) {
      setEstudiantes(res.data);
    }
    setCargando(false);
  }, [call, codigoCurso]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    recargar();
  }, [recargar]);

  const emitidos = estudiantes.filter((e) => e.tipoCertificado !== 'PENDIENTE' && e.tipoCertificado !== null).length;
  const pendientes = estudiantes.filter((e) => e.tipoCertificado === 'PENDIENTE').length;
  const todosConNota = estudiantes.length > 0 && estudiantes.every((e) => e.notaFinal !== null);

  const emitir = async () => {
    const res = await call<ResultadoEmision>(
      `/api/asistencia/curso/${codigoCurso}/certificados`,
      { method: 'POST' },
    );
    if (!res?.ok) return;

    const { emitidos: n, omitidos } = res.data;
    if (omitidos.length > 0) {
      toast.warning(`${n} emitidos, ${omitidos.length} omitidos por asistencia.`);
    } else {
      toast.success(`${n} certificado${n === 1 ? '' : 's'} emitido${n === 1 ? '' : 's'}.`);
    }
    await recargar();
  };

  if (cargando) {
    return <div className="p-8 text-center text-text-muted">Cargando certificados...</div>;
  }

  if (estudiantes.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        No hay estudiantes inscritos en este curso.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen + emitir */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-card-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <span className="text-sm font-semibold text-text-main">
            {emitidos} emitido{emitidos === 1 ? '' : 's'} &middot; {pendientes} pendiente
            {pendientes === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex-1" />

        {!todosConNota && (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
            Faltan notas por registrar
          </span>
        )}
        <Button
          variant="primary"
          size="sm"
          icon={<Send size={16} />}
          onClick={emitir}
          disabled={loading || pendientes === 0 || !todosConNota}
        >
          {loading ? 'Emitiendo...' : 'Emitir certificados del curso'}
        </Button>
      </div>

      {pendientes === 0 && (
        <div className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
          Todos los certificados de este curso han sido emitidos.
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
              <tr>
                <th className="p-4 font-semibold w-12">N°</th>
                <th className="p-4 font-semibold">Estudiante</th>
                <th className="p-4 font-semibold">Nota</th>
                <th className="p-4 font-semibold">Asistencia</th>
                <th className="p-4 font-semibold">Estado certificado</th>
                <th className="p-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-secondary text-sm">
              {estudiantes.map((est, indice) => {
                const emitido = est.tipoCertificado === 'APROBADO' || est.tipoCertificado === 'ASISTENCIA';
                return (
                  <tr key={est.ci} className="border-b border-card-border hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-text-muted text-xs">{indice + 1}</td>
                    <td className="p-4">
                      <p className="font-bold text-text-main">
                        {est.apellidos} {est.nombres}
                      </p>
                      <p className="text-text-muted text-xs">CI: {est.ci}</p>
                    </td>
                    <td className="p-4 text-sm font-bold text-text-main">
                      {est.notaFinal ?? '—'}
                    </td>
                    <td className="p-4 text-sm text-text-main">
                      {est.pctAsistencia}%
                      {!est.elegibleCertificado && (
                        <span className="ml-1 text-red-600 text-xs font-semibold" title="Supera el máximo de ausencias">
                          (no habilitado)
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <BadgeEstado tipo={est.tipoCertificado} />
                    </td>
                    <td className="p-4">
                      {emitido && est.codigoVerificacion ? (
                        <a
                          href={`/api/asistencia/certificado/${est.codigoVerificacion}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-opacity-90 transition-colors"
                        >
                          <Download size={14} /> PDF
                        </a>
                      ) : (
                        <span className="text-xs text-text-muted italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
