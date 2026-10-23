'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useApi } from '@/src/hooks/useApi';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

/** Notificaciones del usuario de la sesion (ej. cambio de grupo o curso cerrado). */
export function NotificacionesPanel() {
  const { call } = useApi();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    let montado = true;
    call<Notificacion[]>('/api/notificaciones', { silent: true }).then((res) => {
      if (montado && res?.ok) setNotificaciones(res.data);
    });
    return () => {
      montado = false;
    };
  }, [call]);

  const marcarLeida = async (id: number) => {
    const res = await call(`/api/notificaciones/${id}`, { method: 'PATCH' });
    if (res?.ok) {
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    }
  };

  if (notificaciones.length === 0) return null;

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <section className="mb-8 border border-card-border rounded-xl p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={20} className="text-primary" />
        <h3 className="font-primary font-bold text-text-main">Notificaciones</h3>
        {sinLeer > 0 && (
          <span className="text-xs font-semibold bg-secondary text-white rounded-full px-2 py-0.5">
            {sinLeer} nueva(s)
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {notificaciones.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg p-3 border ${n.leida ? 'border-card-border bg-card-bg' : 'border-blue-200 bg-blue-50'}`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-semibold text-text-main">{n.titulo}</p>
                <p className="text-sm text-text-main mt-1">{n.mensaje}</p>
                <p className="text-xs text-text-muted mt-1">{new Date(n.fecha).toLocaleString()}</p>
              </div>
              {!n.leida && (
                <button
                  onClick={() => marcarLeida(n.id)}
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Marcar leída
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
