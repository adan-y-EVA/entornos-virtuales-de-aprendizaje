'use client';

import React from 'react';
import type { EstadoAsistencia } from './types';

const VARIANTES: Record<EstadoAsistencia, { label: string; className: string }> = {
  PRESENTE: { label: 'Presente', className: 'bg-green-100 text-green-800' },
  JUSTIFICADA: { label: 'Justificada', className: 'bg-yellow-100 text-yellow-800' },
  AUSENTE: { label: 'Ausente', className: 'bg-red-100 text-red-800' },
};

export function AttendanceBadge({ estado }: { estado: EstadoAsistencia }) {
  const variante = VARIANTES[estado];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${variante.className}`}>
      {variante.label}
    </span>
  );
}
