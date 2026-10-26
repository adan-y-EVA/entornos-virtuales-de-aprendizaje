'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Users } from 'lucide-react';
import { useApi } from '@/src/hooks/useApi';
import { Badge } from '../components/Badge';
import { GradeMatrix } from '../components/asistencia/GradeMatrix';
import { formatFecha, type CursoAsistencia } from '../components/asistencia/types';

type Pestana = 'sesiones' | 'notas';
type FiltroCurso = 'ACTIVO' | 'CERRADO' | 'TODOS';

const FILTROS: { valor: FiltroCurso; etiqueta: string }[] = [
  { valor: 'ACTIVO', etiqueta: 'Activos' },
  { valor: 'CERRADO', etiqueta: 'Cerrados' },
  { valor: 'TODOS', etiqueta: 'Todos' },
];

export default function PaginaAsistencia() {
  const [cursos, setCursos] = useState<CursoAsistencia[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('sesiones');
  const [filtro, setFiltro] = useState<FiltroCurso>('ACTIVO');
  const [cargando, setCargando] = useState(true);
  const { call } = useApi();

  const cargar = useCallback(async () => {
    const res = await call<CursoAsistencia[]>('/api/asistencia');
    if (res?.ok) {
      setCursos(res.data);
      setSeleccionado((actual) => actual ?? res.data[0]?.codigo ?? null);
    }
    setCargando(false);
  }, [call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const seleccionarCurso = (codigo: string) => {
    setSeleccionado(codigo);
    setPestana('sesiones');
  };

  const cursosFiltrados = useMemo(() => {
    if (filtro === 'TODOS') return cursos;
    return cursos.filter((curso) => (curso.estado || 'ACTIVO') === filtro);
  }, [cursos, filtro]);

  const cursoActual = useMemo(
    () =>
      cursosFiltrados.find((curso) => curso.codigo === seleccionado) ??
      cursosFiltrados[0] ??
      null,
    [cursosFiltrados, seleccionado],
  );

  return (
    <div className="flex flex-col h-full bg-card-bg p-6 gap-4">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-primary font-bold text-text-main">Asistencia y Notas</h1>
        <p className="text-text-muted text-sm mt-1">
          Registro de asistencia por curso y gestión de notas con promedios
        </p>
      </div>

      {cargando ? (
        <div className="p-8 text-center text-text-muted bg-white border border-card-border rounded-xl">
          Cargando cursos...
        </div>
      ) : cursos.length === 0 ? (
        <div className="p-8 text-center text-text-muted bg-white border border-card-border rounded-xl">
          No tienes cursos registrados.
        </div>
      ) : (
        <>
          {/* Filtro por estado + selector de cursos */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-input-border bg-white p-1">
              {FILTROS.map((opcion) => (
                <button
                  key={opcion.valor}
                  onClick={() => setFiltro(opcion.valor)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    filtro === opcion.valor
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:bg-gray-100'
                  }`}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
            <span className="text-xs text-text-muted font-secondary">
              {cursosFiltrados.length} curso{cursosFiltrados.length === 1 ? '' : 's'}
            </span>
          </div>

          {cursosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-text-muted bg-white border border-card-border rounded-xl">
              No hay cursos {filtro === 'TODOS' ? '' : filtro === 'ACTIVO' ? 'activos' : 'cerrados'}{' '}
              para ti.
            </div>
          ) : (
          <>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cursosFiltrados.map((curso) => {
              const activo = curso.codigo === seleccionado;
              return (
                <button
                  key={curso.codigo}
                  onClick={() => seleccionarCurso(curso.codigo)}
                  className={`min-w-[240px] text-left p-4 rounded-xl border transition-colors ${
                    activo
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-text-main border-card-border hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold font-secondary text-sm">{curso.nombre}</p>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        activo ? 'text-blue-200' : 'text-primary'
                      }`}
                    >
                      {curso.codigo}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-3 mt-2 text-xs font-secondary ${
                      activo ? 'text-blue-100' : 'text-text-muted'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {curso.numInscritos} inscritos
                    </span>
                    <span>
                      Nivel {curso.nivel} &middot; Grupo {curso.grupo}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel del curso seleccionado: sesiones / notas */}
          <div className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="bg-card-bg border-b border-card-border">
              <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="font-primary font-bold text-text-main">
                    {pestana === 'sesiones' ? 'Sesiones' : 'Notas'}{' '}
                    {cursoActual ? `- ${cursoActual.nombre}` : ''}
                  </h2>
                  {cursoActual && (
                    <p className="text-text-muted text-xs mt-0.5">
                      {formatFecha(cursoActual.fechaIni)} - {formatFecha(cursoActual.fechaFin)}{' '}
                      &middot;{' '}
                      <Badge
                        variant={
                          (cursoActual.estado || 'ACTIVO') === 'ACTIVO' ? 'success' : 'error'
                        }
                      >
                        {(cursoActual.estado || 'ACTIVO') === 'ACTIVO' ? 'Activo' : 'Cerrado'}
                      </Badge>
                    </p>
                  )}
                </div>

                {/* Pestañas */}
                <div className="flex gap-1 rounded-lg border border-input-border bg-white p-1">
                  <button
                    onClick={() => setPestana('sesiones')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      pestana === 'sesiones'
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-gray-100'
                    }`}
                  >
                    Sesiones
                  </button>
                  <button
                    onClick={() => setPestana('notas')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      pestana === 'notas'
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-gray-100'
                    }`}
                  >
                    Notas
                  </button>
                </div>
              </div>
            </div>

            {pestana === 'notas' ? (
              cursoActual ? (
                <div className="p-4">
                  <GradeMatrix key={cursoActual.codigo} codigoCurso={cursoActual.codigo} />
                </div>
              ) : null
            ) : cursoActual && cursoActual.sesiones.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                Este curso no tiene sesiones registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-text-muted font-secondary text-sm border-b border-card-border">
                    <tr>
                      <th className="p-4 font-semibold">#</th>
                      <th className="p-4 font-semibold">Fecha</th>
                      <th className="p-4 font-semibold">Horario</th>
                      <th className="p-4 font-semibold">Ambiente</th>
                      <th className="p-4 font-semibold">Presentes</th>
                      <th className="p-4 font-semibold">Justificadas</th>
                      <th className="p-4 font-semibold">Ausentes</th>
                      <th className="p-4 font-semibold">Sin marcar</th>
                      <th className="p-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="font-secondary text-sm">
                    {cursoActual?.sesiones.map((sesion, indice) => {
                      const sinMarcar = sesion.total === 0;
                      return (
                        <tr
                          key={sesion.id}
                          className="border-b border-card-border hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 text-text-muted text-xs">{indice + 1}</td>
                          <td className="p-4 text-text-main text-sm font-medium">
                            {formatFecha(sesion.fecha)}
                          </td>
                          <td className="p-4 text-text-muted text-xs">
                            {sesion.horaInicio} - {sesion.horaFin}
                          </td>
                          <td className="p-4 text-text-main text-xs">
                            {sesion.ambiente ?? 'Por asignar'}
                          </td>
                          <td className="p-4 text-xs font-semibold text-green-700">
                            {sesion.presentes}
                          </td>
                          <td className="p-4 text-xs font-semibold text-yellow-700">
                            {sesion.justificadas}
                          </td>
                          <td className="p-4 text-xs font-semibold text-red-700">
                            {sesion.ausentes}
                          </td>
                          <td className="p-4">
                            {sinMarcar ? (
                              <span className="text-xs text-text-muted italic">Sin marcar</span>
                            ) : (
                              <span className="text-xs text-text-muted">
                                {sesion.presentes + sesion.justificadas + sesion.ausentes} de{' '}
                                {cursoActual.numInscritos}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/asistencia/sesion/${sesion.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-opacity-90 transition-colors"
                            >
                              <CheckCircle size={14} /> Marcar
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}
        </>
      )}
    </div>
  );
}
