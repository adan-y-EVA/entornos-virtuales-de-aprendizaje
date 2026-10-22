'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, Lock, RotateCcw, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { useAuth } from '@/src/context/AuthContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { CertificateList } from '../components/asistencia/CertificateList';
import { formatFecha } from '../components/asistencia/types';

interface CursoResumen {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  fechaFin: string;
  estado: string;
  numInscritos: number;
  notasPendientes: number;
  certificadosEmitidos: number;
  certificadosPendientes: number;
}

interface ResultadoAccion {
  codigo: string;
  estado: string;
}

export default function PaginaMisCursos() {
  const [cursos, setCursos] = useState<CursoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);
  const { call, loading } = useApi();
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';

  const cargar = useCallback(async () => {
    const res = await call<CursoResumen[]>('/api/mis-cursos');
    if (res?.ok) {
      setCursos(res.data);
    }
    setCargando(false);
  }, [call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const cerrarCurso = async (codigo: string) => {
    setAccionando(codigo);
    const res = await call<ResultadoAccion>(`/api/asistencia/curso/${codigo}/cerrar`, {
      method: 'POST',
    });
    setAccionando(null);
    if (res?.ok) {
      toast.success('Curso cerrado correctamente.');
      await cargar();
    } else if (res && !res.ok) {
      toast.error(res.error || 'No se pudo cerrar el curso.');
    }
  };

  const reabrirCurso = async (codigo: string) => {
    setAccionando(codigo);
    const res = await call<ResultadoAccion>(`/api/asistencia/curso/${codigo}/reabrir`, {
      method: 'POST',
    });
    setAccionando(null);
    if (res?.ok) {
      toast.success('Curso reabierto correctamente.');
      await cargar();
    } else if (res && !res.ok) {
      toast.error(res.error || 'No se pudo reabrir el curso.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card-bg p-6 gap-4">
      <div>
        <h1 className="text-2xl font-primary font-bold text-text-main">Mis Cursos</h1>
        <p className="text-text-muted text-sm mt-1">
          Gestiona el ciclo de vida de tus cursos: cerrar, emitir certificados y más
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
        <div className="flex flex-col gap-4">
          {cursos.map((curso) => {
            const activo = curso.estado === 'ACTIVO';
            const cerrado = curso.estado === 'CERRADO';
            const expandidoActual = expandido === curso.codigo;
            const notasCompletas = curso.notasPendientes === 0;
            const puedeCerrar = activo && notasCompletas && curso.numInscritos > 0;
            const pendienteCierre = activo && !notasCompletas;
            const emitidos = curso.certificadosEmitidos;
            const pendientes = curso.certificadosPendientes;
            const accionandoEste = accionando === curso.codigo;

            return (
              <div
                key={curso.codigo}
                className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Header del curso */}
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-primary" />
                      <h3 className="font-primary font-bold text-text-main">{curso.nombre}</h3>
                      <span className="text-xs font-mono font-semibold text-primary">
                        {curso.codigo}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {formatFecha(curso.fechaIni)} - {formatFecha(curso.fechaFin)} &middot;{' '}
                      Nivel {curso.nivel} &middot; Grupo {curso.grupo}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Users size={14} />
                    <span>{curso.numInscritos} inscritos</span>
                  </div>

                  <Badge variant={activo ? 'success' : 'error'}>
                    {activo ? 'Activo' : 'Cerrado'}
                  </Badge>

                  {/* Resumen certificados */}
                  {cerrado && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-700 font-semibold">{emitidos} emitidos</span>
                      <span className="text-yellow-700 font-semibold">{pendientes} pendientes</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {activo && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Lock size={14} />}
                        onClick={() => cerrarCurso(curso.codigo)}
                        disabled={loading || accionandoEste || !puedeCerrar}
                        title={
                          pendienteCierre
                            ? 'Faltan notas por registrar'
                            : 'Cerrar curso (no se podrán hacer modificaciones)'
                        }
                      >
                        {accionandoEste ? 'Cerrando...' : 'Cerrar curso'}
                      </Button>
                    )}
                    {cerrado && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Send size={14} />}
                        onClick={() => setExpandido(expandidoActual ? null : curso.codigo)}
                        disabled={loading}
                      >
                        Ver certificados
                      </Button>
                    )}
                    {cerrado && esAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RotateCcw size={14} />}
                        onClick={() => reabrirCurso(curso.codigo)}
                        disabled={loading || accionandoEste}
                      >
                        {accionandoEste ? 'Reabriendo...' : 'Reabrir curso'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Panel de certificados expandido */}
                {expandidoActual && (
                  <div className="border-t border-card-border p-4 bg-card-bg">
                    <CertificateList key={curso.codigo} codigoCurso={curso.codigo} />
                  </div>
                )}

                {/* Link a asistencia */}
                <div className="px-4 pb-3">
                  <Link
                    href={`/asistencia`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <CheckCircle size={12} /> Ir a Asistencia y Notas
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
