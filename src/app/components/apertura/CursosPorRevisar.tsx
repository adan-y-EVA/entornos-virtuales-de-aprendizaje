'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { RevisionAperturaModal } from './RevisionAperturaModal';

interface CursoPorRevisar {
  codigo: string;
  nombre: string;
  grupo: string;
  fechaLimite: string;
  diasRestantes: number;
  inscritos: number;
  cuposMin: number;
  cumpleMinimo: boolean;
}

function textoPlazo(dias: number): string {
  if (dias < 0) return `Venció hace ${-dias} día(s)`;
  if (dias === 0) return 'Vence hoy';
  return `Faltan ${dias} día(s)`;
}

/** Aviso con los cursos cerca de su fecha limite de inscripcion que falta revisar. */
export function CursosPorRevisar({ onRevisado }: { onRevisado?: () => void }) {
  const { call } = useApi();
  const [cursos, setCursos] = useState<CursoPorRevisar[]>([]);
  const [revisando, setRevisando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await call<CursoPorRevisar[]>('/api/cursos/por-revisar', { silent: true });
    if (res?.ok) setCursos(res.data);
  }, [call]);

  useEffect(() => {
    let montado = true;
    call<CursoPorRevisar[]>('/api/cursos/por-revisar', { silent: true }).then((res) => {
      if (montado && res?.ok) setCursos(res.data);
    });
    return () => {
      montado = false;
    };
  }, [call]);

  if (cursos.length === 0) return null;

  return (
    <section className="mb-8 border border-yellow-300 bg-yellow-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={20} className="text-yellow-700" />
        <h3 className="font-primary font-bold text-text-main">
          Cursos por revisar apertura ({cursos.length})
        </h3>
      </div>
      <div className="space-y-2">
        {cursos.map((curso) => (
          <div
            key={curso.codigo}
            className="bg-white border border-card-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="text-sm">
              <p className="font-semibold text-text-main">
                {curso.codigo} — {curso.nombre} (grupo {curso.grupo})
              </p>
              <p className="text-xs text-text-muted">
                Límite {curso.fechaLimite} · {textoPlazo(curso.diasRestantes)} · {curso.inscritos} de{' '}
                {curso.cuposMin} mínimos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={curso.cumpleMinimo ? 'success' : 'error'}>
                {curso.cumpleMinimo ? 'Cumple mínimo' : 'No cumple'}
              </Badge>
              <Button size="sm" onClick={() => setRevisando(curso.codigo)}>Revisar</Button>
            </div>
          </div>
        ))}
      </div>

      {revisando && (
        <RevisionAperturaModal
          key={revisando}
          codigo={revisando}
          onClose={() => setRevisando(null)}
          onRevisado={() => {
            cargar();
            onRevisado?.();
          }}
        />
      )}
    </section>
  );
}
