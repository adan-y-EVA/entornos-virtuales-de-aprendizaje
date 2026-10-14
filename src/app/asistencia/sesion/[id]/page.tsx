'use client';

import React, { use } from 'react';
import { AttendanceMarking } from '../../../components/asistencia/AttendanceMarking';

export default function PaginaSesionAsistencia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sesionId = Number(id);

  if (!Number.isInteger(sesionId) || sesionId <= 0) {
    return (
      <div className="flex flex-col h-full bg-card-bg p-6">
        <p className="text-center text-text-muted p-8">Sesión inválida.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card-bg p-6">
      <AttendanceMarking sesionId={sesionId} />
    </div>
  );
}
