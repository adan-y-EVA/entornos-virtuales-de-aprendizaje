'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '@/src/hooks/useApi';
import { useAuth } from '@/src/context/AuthContext';
import DashboardStudentView, {
  type CertificadoEstudiante,
  type CursoInscrito,
} from '../../pages/Dashboard-Student';
import { formatFecha, type ProgresoCurso } from '../../components/asistencia/types';

/**
 * Dashboard del estudiante. Consulta el progreso real (asistencia, notas,
 * promedios y certificados) y lo adapta a la forma que espera la vista.
 */
export default function EstudianteDashboardPage() {
  const { user } = useAuth();
  const { call } = useApi();
  const [cursos, setCursos] = useState<ProgresoCurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    const res = await call<ProgresoCurso[]>('/api/dashboard/estudiante/asistencia');
    if (res?.ok) setCursos(res.data);
    setCargando(false);
  }, [call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const inscritos: CursoInscrito[] = useMemo(
    () =>
      cursos.map((curso) => {
        const emitido =
          curso.tipoCertificado === 'APROBADO' || curso.tipoCertificado === 'ASISTENCIA';
        return {
          codigo: curso.codigo,
          nombre: curso.nombre,
          instructor: curso.instructor,
          horario: curso.horario ?? 'Por asignar',
          horas: curso.duracionHoras,
          avance: curso.pctAsistencia,
          nota: curso.notaFinal,
          notaMinima: curso.notaMinima,
          estado: emitido || curso.estadoCurso === 'CERRADO' ? 'finalizado' : 'activo',
        };
      }),
    [cursos],
  );

  const certificados: CertificadoEstudiante[] = useMemo(
    () =>
      cursos
        .filter((curso) => curso.tipoCertificado !== null && curso.codigoVerificacion !== null)
        .map((curso) => ({
          id: curso.codigoVerificacion as string,
          codigo: curso.codigoVerificacion as string,
          curso: curso.nombre,
          nota: curso.notaFinal,
          asistencia: curso.pctAsistencia,
          fecha: curso.fechaEmision ? formatFecha(curso.fechaEmision) : '—',
          estado:
            curso.tipoCertificado === 'APROBADO'
              ? 'aprobado'
              : curso.tipoCertificado === 'ASISTENCIA'
                ? 'asistencia'
                : 'pendiente',
        })),
    [cursos],
  );

  const estadisticas = useMemo(() => {
    const promedioAsistencia =
      cursos.length > 0
        ? Math.round(cursos.reduce((suma, curso) => suma + curso.pctAsistencia, 0) / cursos.length)
        : 0;

    return {
      cursosActivos: inscritos.filter((curso) => curso.estado === 'activo').length,
      horasCursadas: cursos.reduce((suma, curso) => suma + curso.duracionHoras, 0),
      asistenciaPromedio: promedioAsistencia,
      certificados: certificados.filter((cert) => cert.estado !== 'pendiente').length,
    };
  }, [cursos, inscritos, certificados]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-primary font-sans">
      <DashboardStudentView
        nombre={user?.nombre ?? 'estudiante'}
        cargando={cargando}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        estadisticas={estadisticas}
        cursos={inscritos}
        certificados={certificados}
      />
    </div>
  );
}
