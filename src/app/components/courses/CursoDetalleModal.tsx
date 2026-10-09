'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '../Badge';

export interface InscripcionDetalle {
  id: number;
  ciEstudiante: string;
  codigoSis: string;
  nombre: string;
  tipoPrecio: string;
  estado: 'INSCRITO' | 'CANCELADO';
  estadoPago: 'PENDIENTE' | 'PARCIAL' | 'PAGADO_TOTAL';
  montoPagado: number;
  fechaInscripcion: string;
}

export interface CursoDetalle {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  estado: string;
  moneda: string;
  costoExterno: number;
  costoUmss: number;
  costoAuxiliar: number;
  fechaIni: string;
  fechaFin: string;
  duracionHoras: number;
  cuposMax: number;
  inscritos: number;
  instructor: { ci: string; nombre: string; email: string; especialidad: string };
  inscripciones: InscripcionDetalle[];
}

interface CursoDetalleModalProps {
  codigo: string | null;
  onClose: () => void;
}

const variantePago = {
  PENDIENTE: 'error',
  PARCIAL: 'warning',
  PAGADO_TOTAL: 'success',
} as const;

function formatearFecha(iso: string) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase">{etiqueta}</p>
      <p className="text-sm text-text-main">{children}</p>
    </div>
  );
}

export function CursoDetalleModal({ codigo, onClose }: CursoDetalleModalProps) {
  const [resultado, setResultado] = useState<{
    codigo: string;
    curso?: CursoDetalle;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!codigo) return;

    let montado = true;

    const cargar = async () => {
      try {
        const res = await fetch(`/api/cursos/${encodeURIComponent(codigo)}`);
        const data = await res.json();
        if (!montado) return;
        if (res.ok) setResultado({ codigo, curso: data });
        else setResultado({ codigo, error: data.error ?? 'No se pudo cargar el curso' });
      } catch {
        if (montado) setResultado({ codigo, error: 'No se pudo conectar con el servidor' });
      }
    };

    cargar();
    return () => {
      montado = false;
    };
  }, [codigo]);

  // Mientras llega la respuesta del curso nuevo no se muestra la del anterior
  const actual = resultado?.codigo === codigo ? resultado : null;
  const curso = actual?.curso ?? null;
  const error = actual?.error ?? null;

  if (!codigo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-card-border sticky top-0 bg-white">
          <div>
            <h3 className="text-xl font-primary font-bold text-text-main">
              {curso?.nombre ?? 'Detalle del curso'}
            </h3>
            <p className="text-sm text-text-muted font-mono">{codigo}</p>
          </div>
          <button onClick={onClose} className="text-text-muted"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && <p className="text-secondary text-sm">{error}</p>}
          {!error && !curso && <p className="text-center text-text-muted">Cargando detalle...</p>}

          {curso && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Dato etiqueta="Estado">
                  <Badge variant={curso.estado === 'activo' ? 'success' : 'default'}>{curso.estado}</Badge>
                </Dato>
                <Dato etiqueta="Grupo">{curso.grupo}</Dato>
                <Dato etiqueta="Nivel">{curso.nivel}</Dato>
                <Dato etiqueta="Duración">{curso.duracionHoras} hrs</Dato>
                <Dato etiqueta="Inicio">{formatearFecha(curso.fechaIni)}</Dato>
                <Dato etiqueta="Fin">{formatearFecha(curso.fechaFin)}</Dato>
                <Dato etiqueta="Cupos">
                  {curso.inscritos} / {curso.cuposMax > 0 ? curso.cuposMax : 'sin límite'}
                </Dato>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card-bg border border-card-border rounded-lg p-4 space-y-1">
                  <p className="text-xs font-semibold text-text-muted uppercase">Instructor</p>
                  <p className="font-bold text-text-main">{curso.instructor.nombre}</p>
                  <p className="text-sm text-text-muted">{curso.instructor.especialidad}</p>
                  <p className="text-xs text-text-muted">CI {curso.instructor.ci} · {curso.instructor.email}</p>
                </div>
                <div className="bg-card-bg border border-card-border rounded-lg p-4 space-y-1">
                  <p className="text-xs font-semibold text-text-muted uppercase">Precios ({curso.moneda})</p>
                  <p className="text-sm text-text-main">Externo: {curso.costoExterno.toFixed(2)}</p>
                  <p className="text-sm text-text-main">UMSS: {curso.costoUmss.toFixed(2)}</p>
                  <p className="text-sm text-text-main">Auxiliar: {curso.costoAuxiliar.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-primary font-bold text-text-main mb-2">
                  Inscripciones ({curso.inscripciones.length})
                </h4>
                <div className="border border-card-border rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-card-bg text-text-muted border-b border-card-border">
                      <tr>
                        <th className="p-3">Estudiante</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Pago</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curso.inscripciones.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-text-muted">
                            Aún no hay estudiantes inscritos.
                          </td>
                        </tr>
                      ) : (
                        curso.inscripciones.map((inscripcion) => (
                          <tr key={inscripcion.id} className="border-b border-card-border last:border-0">
                            <td className="p-3">
                              <p className="font-semibold text-text-main">{inscripcion.nombre}</p>
                              <p className="text-xs text-text-muted">
                                CI {inscripcion.ciEstudiante} · {inscripcion.codigoSis}
                              </p>
                            </td>
                            <td className="p-3 text-text-main">{inscripcion.tipoPrecio}</td>
                            <td className="p-3">
                              <Badge variant={variantePago[inscripcion.estadoPago]}>{inscripcion.estadoPago}</Badge>
                              {inscripcion.montoPagado > 0 && (
                                <p className="text-xs text-text-muted mt-1">
                                  {curso.moneda} {inscripcion.montoPagado.toFixed(2)}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant={inscripcion.estado === 'INSCRITO' ? 'success' : 'default'}>
                                {inscripcion.estado}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
