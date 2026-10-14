'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';
import { AttendanceBadge } from './AttendanceBadge';
import { formatFecha, type EstadoAsistencia, type SesionDetalle } from './types';

const POR_PAGINA = 25;

const OPCIONES: {
  estado: EstadoAsistencia;
  label: string;
  activo: string;
  inactivo: string;
}[] = [
  {
    estado: 'PRESENTE',
    label: 'Presente',
    activo: 'bg-green-600 text-white border-green-600',
    inactivo: 'bg-white text-green-700 border-input-border hover:bg-green-50',
  },
  {
    estado: 'JUSTIFICADA',
    label: 'Justificada',
    activo: 'bg-yellow-500 text-white border-yellow-500',
    inactivo: 'bg-white text-yellow-700 border-input-border hover:bg-yellow-50',
  },
  {
    estado: 'AUSENTE',
    label: 'Ausente',
    activo: 'bg-red-600 text-white border-red-600',
    inactivo: 'bg-white text-red-700 border-input-border hover:bg-red-50',
  },
];

export function AttendanceMarking({ sesionId }: { sesionId: number }) {
  const [datos, setDatos] = useState<SesionDetalle | null>(null);
  const [originales, setOriginales] = useState<Record<string, EstadoAsistencia>>({});
  const [estados, setEstados] = useState<Record<string, EstadoAsistencia>>({});
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const { call, loading } = useApi();

  const recargar = useCallback(async () => {
    const res = await call<SesionDetalle>(`/api/asistencia/sesion/${sesionId}`);
    if (res?.ok) {
      setDatos(res.data);
      const base: Record<string, EstadoAsistencia> = {};
      for (const fila of res.data.asistencias) base[fila.ciEstudiante] = fila.estado;
      setOriginales(base);
      setEstados(base);
      setCargando(false);
    } else {
      setCargando(false);
    }
  }, [call, sesionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  const pendientes = useMemo(
    () =>
      Object.keys(estados).filter((ci) => estados[ci] !== originales[ci]).length,
    [estados, originales],
  );

  const marcarTodos = (estado: EstadoAsistencia) => {
    const todos: Record<string, EstadoAsistencia> = {};
    for (const fila of datos?.asistencias ?? []) todos[fila.ciEstudiante] = estado;
    setEstados(todos);
  };

  const marcarFila = (ci: string, estado: EstadoAsistencia) => {
    setEstados((prev) => ({ ...prev, [ci]: estado }));
  };

  const guardar = async () => {
    const cambios = Object.keys(estados)
      .filter((ci) => estados[ci] !== originales[ci])
      .map((ciEstudiante) => ({ ciEstudiante, estado: estados[ciEstudiante] }));

    if (cambios.length === 0) {
      toast.info('No hay cambios pendientes.');
      return;
    }

    const res = await call<{ actualizados: number }>(
      `/api/asistencia/sesion/${sesionId}`,
      { method: 'PATCH', body: { asistencias: cambios } },
    );
    if (!res?.ok) return;

    toast.success(`Asistencia guardada (${res.data.actualizados} registro${res.data.actualizados === 1 ? '' : 's'}).`);
    await recargar();
  };

  if (cargando) {
    return <div className="p-8 text-center text-text-muted">Cargando sesión...</div>;
  }

  if (!datos) {
    return (
      <div className="p-8 text-center text-text-muted">
        No se pudo cargar la sesión.{' '}
        <Link href="/asistencia" className="text-primary underline">
          Volver a Asistencia
        </Link>
      </div>
    );
  }

  const filas = datos.asistencias;
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado de sesión */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <Link
            href="/asistencia"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2"
          >
            <ArrowLeft size={16} /> Volver a sesiones
          </Link>
          <h1 className="text-2xl font-primary font-bold text-text-main">
            {datos.sesion.curso.nombre}
          </h1>
          <p className="text-text-muted text-sm mt-1 font-secondary">
            {datos.sesion.curso.codigo} &middot; {formatFecha(datos.sesion.fecha)} &middot;{' '}
            {datos.sesion.horaInicio} - {datos.sesion.horaFin} &middot;{' '}
            {datos.sesion.ambiente ?? 'Ambiente por asignar'}
          </p>
          <p className="text-text-muted text-xs mt-0.5 font-secondary">
            Instructor: {datos.sesion.curso.instructor}
          </p>
        </div>
        <div className="text-right">
          <BadgeResumen
            presentes={estadosConteo(estados, 'PRESENTE')}
            justificadas={estadosConteo(estados, 'JUSTIFICADA')}
            ausentes={estadosConteo(estados, 'AUSENTE')}
          />
        </div>
      </div>

      {/* Barra de acciones masivas */}
      <div className="bg-white border border-card-border rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-text-main">Marcar todos:</span>
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.estado}
            onClick={() => marcarTodos(opcion.estado)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${opcion.inactivo}`}
          >
            {opcion.label}
          </button>
        ))}

        <div className="flex-1" />

        {pendientes > 0 && (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
            {pendientes} cambio{pendientes === 1 ? '' : 's'} sin guardar
          </span>
        )}
        <Button
          variant="primary"
          size="sm"
          icon={<Save size={16} />}
          onClick={guardar}
          disabled={loading || pendientes === 0}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {/* Tabla de marcado */}
      <div className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden">
        {filas.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No hay estudiantes inscritos en este curso.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
                  <tr>
                    <th className="p-4 font-semibold w-12">N°</th>
                    <th className="p-4 font-semibold">Estudiante</th>
                    <th className="p-4 font-semibold">CI / SIS</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Actual</th>
                  </tr>
                </thead>
                <tbody className="font-secondary text-sm">
                  {visibles.map((fila, indice) => {
                    const actual = estados[fila.ciEstudiante];
                    const cambio = actual !== originales[fila.ciEstudiante];
                    return (
                      <tr
                        key={fila.ciEstudiante}
                        className={`border-b border-card-border ${
                          cambio ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-4 text-text-muted text-xs">
                          {(paginaActual - 1) * POR_PAGINA + indice + 1}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-text-main">
                            {fila.apellidos} {fila.nombres}
                          </p>
                          <p className="text-text-muted text-xs">SIS: {fila.codigoSis}</p>
                        </td>
                        <td className="p-4 text-text-muted font-mono text-xs">{fila.ciEstudiante}</td>
                        <td className="p-4">
                          <div className="inline-flex rounded-lg border border-input-border overflow-hidden">
                            {OPCIONES.map((opcion) => (
                              <button
                                key={opcion.estado}
                                onClick={() => marcarFila(fila.ciEstudiante, opcion.estado)}
                                className={`px-3 py-1.5 text-xs font-semibold border-r border-input-border last:border-r-0 transition-colors ${
                                  actual === opcion.estado ? opcion.activo : opcion.inactivo
                                }`}
                              >
                                {opcion.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <AttendanceBadge estado={fila.estado} />
                            {cambio && (
                              <span className="text-yellow-600" title="Cambio sin guardar">
                                <CheckCircle size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-card-border bg-card-bg font-secondary text-sm">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 rounded-lg border border-input-border bg-white text-text-main disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-text-muted">
                  Página {paginaActual} de {totalPaginas} ({filas.length} estudiantes)
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 rounded-lg border border-input-border bg-white text-text-main disabled:opacity-40 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function estadosConteo(estados: Record<string, EstadoAsistencia>, estado: EstadoAsistencia) {
  return Object.values(estados).filter((valor) => valor === estado).length;
}

function BadgeResumen({
  presentes,
  justificadas,
  ausentes,
}: {
  presentes: number;
  justificadas: number;
  ausentes: number;
}) {
  return (
    <div className="inline-flex gap-2 bg-white border border-card-border rounded-xl px-4 py-2 shadow-sm">
      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
        P: {presentes}
      </span>
      <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
        J: {justificadas}
      </span>
      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
        A: {ausentes}
      </span>
    </div>
  );
}
