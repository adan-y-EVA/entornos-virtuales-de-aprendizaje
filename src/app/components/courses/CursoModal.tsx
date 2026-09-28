import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../Button';

const cursoSchema = z.object({
  codigo: z.string().min(2, "El código es requerido"),
  ciInstructor: z.string().min(5, "Carnet inválido"),
  nombre: z.string().min(5, "Nombre muy corto"),
  grupo: z.string().min(1, "Grupo requerido"),
  nivel: z.string().min(2, "Nivel requerido"),
  costo: z.number().min(0, "Costo no puede ser negativo"),
  fechaIni: z.string().min(1, "Fecha requerida"),
  fechaFin: z.string().min(1, "Fecha requerida"),
  duracionHoras: z.number().min(1, "Mínimo 1 hora"),
  cuposMax: z.number().min(0, "Los cupos no pueden ser negativos"),
});

export type CursoFormData = z.infer<typeof cursoSchema>;

export interface CursoData extends CursoFormData {
  estado?: string;
  numInscritos?: number;
}

interface CursoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<CursoFormData>; 
  cursoEditando: CursoData | null;
}

export function CursoFormModal({ isOpen, onClose, onSubmit, cursoEditando }: CursoFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
  });

  useEffect(() => {
    if (cursoEditando) {
      reset({
        ...cursoEditando,
        costo: Number(cursoEditando.costo),
        fechaIni: new Date(cursoEditando.fechaIni).toISOString().split('T')[0],
        fechaFin: new Date(cursoEditando.fechaFin).toISOString().split('T')[0],
      });
    } else {
      reset({ codigo: '', ciInstructor: '', nombre: '', grupo: '', nivel: '', costo: 0, duracionHoras: 0, cuposMax: 0, fechaIni: '', fechaFin: '' });
    }
  }, [cursoEditando, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-card-border sticky top-0 bg-white">
          <h3 className="text-xl font-primary font-bold text-text-main">
            {cursoEditando ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </h3>
          <button onClick={onClose} className="text-text-muted"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Código del Curso</label>
              <input {...register('codigo')} disabled={!!cursoEditando} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100" />
              {errors.codigo && <p className="text-secondary text-xs">{errors.codigo.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">CI Instructor</label>
              <input {...register('ciInstructor')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.ciInstructor && <p className="text-secondary text-xs">{errors.ciInstructor.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-main">Nombre del Curso</label>
            <input {...register('nombre')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
            {errors.nombre && <p className="text-secondary text-xs">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Nivel</label>
              <input {...register('nivel')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.nivel && <p className="text-secondary text-xs">{errors.nivel.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Grupo</label>
              <input {...register('grupo')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.grupo && <p className="text-secondary text-xs">{errors.grupo.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Fecha de Inicio</label>
              <input type="date" {...register('fechaIni')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.fechaIni && <p className="text-secondary text-xs">{errors.fechaIni.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Fecha de Fin</label>
              <input type="date" {...register('fechaFin')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.fechaFin && <p className="text-secondary text-xs">{errors.fechaFin.message}</p>}
            </div>
            
            <div className="space-y-1">
                <label className="text-sm font-semibold text-text-main">Horas Totales</label>
                <input type="number" {...register('duracionHoras', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
                {errors.duracionHoras && <p className="text-secondary text-xs">{errors.duracionHoras.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Costo (Bs.)</label>
              <input type="number" step="0.1" {...register('costo', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.costo && <p className="text-secondary text-xs">{errors.costo.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">
                Cupos (0 = sin límite)
              </label>
              <input type="number" min={0} {...register('cuposMax', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.cuposMax && <p className="text-secondary text-xs">{errors.cuposMax.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-card-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (cursoEditando ? 'Guardar Cambios' : 'Crear Curso')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}