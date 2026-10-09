import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../Button';

const cursoSchema = z.object({
  codigo: z.string().min(2, "Requerido"),
  ciInstructor: z.string().min(1, "Selecciona un instructor"),
  nombre: z.string().min(5, "Muy corto"),
  grupo: z.string().min(1, "Requerido"),
  nivel: z.string().min(1, "Selecciona un nivel"),
  costoExterno: z.number().min(0, "No negativo"),
  costoUmss: z.number().min(0, "No negativo"),
  costoAuxiliar: z.number().min(0, "No negativo"),
  fechaIni: z.string().min(1, "Requerido"),
  fechaFin: z.string().min(1, "Requerido"),
  duracionHoras: z.number().min(1, "Mínimo 1 hora"),
  cuposMax: z.number().min(0, "Los cupos no pueden ser negativos"),
});

export type CursoFormData = z.infer<typeof cursoSchema>;

export interface CursoData extends CursoFormData {
  estado?: string;
  numInscritos?: number;
}

export interface InstructorData {
  ci: string;
  nombre: string;
  apellido: string;
}

interface CursoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<CursoFormData>;
  cursoEditando: CursoData | null;
  instructores: InstructorData[];
}

export function CursoFormModal({ isOpen, onClose, onSubmit, cursoEditando, instructores }: CursoFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
  });

  useEffect(() => {
    if (cursoEditando) {
      reset({
        ...cursoEditando,
        costoExterno: Number(cursoEditando.costoExterno),
        costoUmss: Number(cursoEditando.costoUmss),
        costoAuxiliar: Number(cursoEditando.costoAuxiliar),
        cuposMax: Number(cursoEditando.cuposMax || 0), // Agregado para recuperar el valor al editar
        fechaIni: new Date(cursoEditando.fechaIni).toISOString().split('T')[0],
        fechaFin: new Date(cursoEditando.fechaFin).toISOString().split('T')[0],
      });
    } else {
      reset({ codigo: '', ciInstructor: '', nombre: '', grupo: '', nivel: '', costoExterno: 0, costoUmss: 0, costoAuxiliar: 0, duracionHoras: 0, cuposMax: 0, fechaIni: '', fechaFin: '' });
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
              <label className="text-sm font-semibold text-text-main">Instructor</label>
              <select {...register('ciInstructor')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Seleccione un instructor...</option>
                {instructores.map(inst => (
                  <option key={inst.ci} value={inst.ci}>
                    {inst.nombre} {inst.apellido} ({inst.ci})
                  </option>
                ))}
              </select>
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
              <select {...register('nivel')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Seleccione...</option>
                <option value="Básico">Básico</option>
                <option value="Medio">Medio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
              {errors.nivel && <p className="text-secondary text-xs">{errors.nivel.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Grupo</label>
              <input {...register('grupo')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.grupo && <p className="text-secondary text-xs">{errors.grupo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Costo Externo</label>
              <input type="number" step="0.1" {...register('costoExterno', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.costoExterno && <p className="text-secondary text-xs">{errors.costoExterno.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Costo UMSS</label>
              <input type="number" step="0.1" {...register('costoUmss', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.costoUmss && <p className="text-secondary text-xs">{errors.costoUmss.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Costo Auxiliares</label>
              <input type="number" step="0.1" {...register('costoAuxiliar', { valueAsNumber: true })} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm" />
              {errors.costoAuxiliar && <p className="text-secondary text-xs">{errors.costoAuxiliar.message}</p>}
            </div>
          </div>

          {/* Ajustado a 2 columnas para cuadrar los 4 elementos restantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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