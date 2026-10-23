import React from 'react';
import { Edit, Archive, ArchiveRestore, CalendarCheck } from 'lucide-react';
import { Badge } from '../Badge';
import type { CursoData } from './CursoModal';

interface CursoTableProps {
  cursos:CursoData[];
  cargando: boolean;
  onEdit: (curso: CursoData) => void;
  onArchivar: (codigo: string, estadoActual: string) => void;
  onRevisarApertura: (codigo: string) => void;
}

const APERTURA = {
  PENDIENTE: { texto: 'Por revisar', variant: 'warning' },
  ABIERTO: { texto: 'Abierto', variant: 'success' },
  CERRADO: { texto: 'No abrió', variant: 'error' },
} as const;

export function CursoTable({ cursos, cargando, onEdit, onArchivar, onRevisarApertura }: CursoTableProps) {
  if (cargando) {
    return <div className="p-8 text-center text-text-muted">Cargando cursos...</div>;
  }

  if (cursos.length === 0) {
    return <div className="p-8 text-center text-text-muted">No hay cursos registrados.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
            <th className="p-4 font-semibold">Código / Nombre</th>
            <th className="p-4 font-semibold">Nivel / Grupo</th>
            <th className="p-4 font-semibold">Fechas / Horas</th>
            <th className="p-4 font-semibold">Costo</th>
            <th className="p-4 font-semibold">Estado</th>
            <th className="p-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="font-secondary text-sm">
          {cursos.map((curso) => (
            <tr key={curso.codigo} className="border-b border-card-border hover:bg-gray-50">
              <td className="p-4">
                <p className="font-bold text-text-main">{curso.codigo}</p>
                <p className="text-text-muted text-xs truncate max-w-[200px]">{curso.nombre}</p>
              </td>
              <td className="p-4 text-text-main text-xs">
                <div>Nivel: {curso.nivel}</div>
                <div>Grupo: {curso.grupo}</div>
              </td>
              <td className="p-4 text-text-main text-xs">
                <div>{new Date(curso.fechaIni).toLocaleDateString()} - {new Date(curso.fechaFin).toLocaleDateString()}</div>
                <div className="text-text-muted">{curso.duracionHoras} hrs | Inscritos: {curso.numInscritos}</div>
                {(curso.cuposMin ?? 0) > 0 && (
                  <div className="text-text-muted">Mínimo: {curso.cuposMin}</div>
                )}
              </td>
              <td className="p-4 text-text-main text-xs">
                <div className="font-bold">Ext: Bs. {Number(curso.costoExterno).toFixed(2)}</div>
                <div>UMSS: Bs. {Number(curso.costoUmss).toFixed(2)}</div>
                <div className="text-text-muted">Aux: Bs. {Number(curso.costoAuxiliar).toFixed(2)}</div>
              </td>
              <td className="p-4">
                <Badge variant={(curso.estado || 'ACTIVO') === 'ACTIVO' ? 'success' : 'error'}>
                  {(curso.estado || 'ACTIVO') === 'ACTIVO' ? 'Activo' : 'Cerrado'}
                </Badge>
                {curso.estadoApertura && (
                  <div className="mt-1">
                    <Badge variant={APERTURA[curso.estadoApertura].variant}>
                      {APERTURA[curso.estadoApertura].texto}
                    </Badge>
                  </div>
                )}
              </td>
              <td className="p-4 flex space-x-2">
                <button onClick={() => onEdit(curso)} className="p-1.5 text-primary hover:bg-blue-50 rounded">
                  <Edit size={18} />
                </button>
                {curso.estadoApertura === 'PENDIENTE' && (curso.estado || 'ACTIVO') === 'ACTIVO' && (
                  <button
                    onClick={() => onRevisarApertura(curso.codigo)}
                    title="Revisar apertura"
                    className="p-1.5 text-yellow-700 hover:bg-yellow-50 rounded"
                  >
                    <CalendarCheck size={18} />
                  </button>
                )}
                <button 
                  onClick={() => onArchivar(curso.codigo, curso.estado || 'ACTIVO')} 
                  className={`p-1.5 rounded ${(curso.estado || 'ACTIVO') === 'ACTIVO' ? 'text-secondary hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                >
                  {(curso.estado || 'ACTIVO') === 'ACTIVO' ? <Archive size={18} /> : <ArchiveRestore size={18} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}