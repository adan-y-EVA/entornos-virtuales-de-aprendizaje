'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/src/hooks/useApi';
import { ProgressCard } from '../../../components/asistencia/ProgressCard';
import type { ProgresoCurso } from '../../../components/asistencia/types';

export default function PaginaAsistenciaEstudiante() {
  const [cursos, setCursos] = useState<ProgresoCurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const { call } = useApi();

  const cargar = useCallback(async () => {
    const res = await call<ProgresoCurso[]>('/api/dashboard/estudiante/asistencia');
    if (res?.ok) setCursos(res.data);
    setCargando(false);
  }, [call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const promedio =
    cursos.length > 0
      ? Math.round(cursos.reduce((suma, curso) => suma + curso.pctAsistencia, 0) / cursos.length)
      : 0;

  return (
    <div className="flex flex-col h-full bg-card-bg p-6 gap-4">
      <div>
        <h1 className="text-2xl font-primary font-bold text-text-main">Mi Asistencia</h1>
        <p className="text-text-muted text-sm mt-1">
          Progreso de asistencia y notas por curso
        </p>
      </div>

      {cargando ? (
        <div className="p-8 text-center text-text-muted bg-white border border-card-border rounded-xl">
          Cargando tu progreso...
        </div>
      ) : cursos.length === 0 ? (
        <div className="p-8 text-center text-text-muted bg-white border border-card-border rounded-xl">
          No estás inscrito en ningún curso aún.
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white border border-card-border rounded-xl px-5 py-3 shadow-sm">
              <p className="text-xs text-text-muted font-semibold">Cursos</p>
              <p className="text-xl font-bold text-text-main">{cursos.length}</p>
            </div>
            <div className="bg-white border border-card-border rounded-xl px-5 py-3 shadow-sm">
              <p className="text-xs text-text-muted font-semibold">Asistencia promedio</p>
              <p className="text-xl font-bold text-primary">{promedio}%</p>
            </div>
            <div className="bg-white border border-card-border rounded-xl px-5 py-3 shadow-sm">
              <p className="text-xs text-text-muted font-semibold">Certificados obtenidos</p>
              <p className="text-xl font-bold text-text-main">
                {cursos.filter((curso) => curso.tipoCertificado).length}
              </p>
            </div>
          </div>

          {/* Tarjetas de progreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cursos.map((curso) => (
              <ProgressCard key={curso.codigo} curso={curso} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
