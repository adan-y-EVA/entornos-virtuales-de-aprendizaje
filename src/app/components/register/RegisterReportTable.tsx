import React from 'react';
import { Badge } from '../Badge';

export interface ErrorFila {
  columna: string;
  mensaje: string;
}

export interface FilaReporte {
  fila: number;
  ciEstudiante: string;
  nombres: string;
  apellidos: string;
  estado: 'OK' | 'ERROR';
  errores: ErrorFila[];
}

interface OpcionesTabla {
  filas: FilaReporte[];
}

export function TablaReporteInscripciones({ filas }: OpcionesTabla) {
  return (
    <div className="border border-card-border rounded-lg overflow-x-auto max-h-96">
      <table className="w-full text-left text-sm">
        <thead className="bg-card-bg text-text-muted font-secondary border-b border-card-border">
          <tr>
            <th className="p-3">Fila</th>
            <th className="p-3">CI</th>
            <th className="p-3">Estudiante</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.fila} className="border-b border-card-border align-top">
              <td className="p-3 font-mono text-xs text-text-muted">{fila.fila}</td>
              <td className="p-3 font-mono text-xs text-text-main">{fila.ciEstudiante}</td>
              <td className="p-3 text-text-main">
                {fila.nombres} {fila.apellidos}
              </td>
              <td className="p-3">
                {fila.estado === 'OK' ? (
                  <Badge variant="success">Inscrito</Badge>
                ) : (
                  <Badge variant="error">Error</Badge>
                )}
              </td>
              <td className="p-3 text-xs text-secondary">
                {fila.errores.length === 0
                  ? '—'
                  : fila.errores.map((error) => (
                      <p key={`${fila.fila}-${error.columna}`}>
                        <span className="font-mono font-semibold">{error.columna}:</span> {error.mensaje}
                      </p>
                    ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
