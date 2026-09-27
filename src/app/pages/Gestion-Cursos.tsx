'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Archive, ArchiveRestore, Search, X } from 'lucide-react';
import { Button } from '../components/Button'; // Ajusta la ruta según tu estructura
import { Badge } from '../components/Badge';   // Ajusta la ruta según tu estructura

// 1. Esquema de validación con Zod
const cursoSchema = z.object({
  nombre: z.string().min(5, "El nombre debe tener al menos 5 caracteres"),
  descripcion: z.string().min(10, "La descripción es muy corta"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  cupoMaximo: z.coerce.number().min(1, "Debe haber al menos 1 cupo"),
  horas: z.coerce.number().min(1, "El curso debe tener al menos 1 hora"),
  precioEstandar: z.coerce.number().min(0, "El precio no puede ser negativo"),
  precioAuxiliar: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

type CursoFormData = z.infer<typeof cursoSchema>;

// Tipo base para el curso en la tabla
interface Curso extends CursoFormData {
  id: string;
  estado: 'activo' | 'archivado';
}

export function GestionCursos() {
  // Estado local para simular la base de datos (Backend pendiente)
  const [cursos, setCursos] = useState<Curso[]>([
    {
      id: '1', nombre: 'NodeJS Avanzado', descripcion: 'Desarrollo backend con Express y Prisma',
      fechaInicio: '2026-10-01', fechaFin: '2026-11-01', cupoMaximo: 30, horas: 40,
      precioEstandar: 300, precioAuxiliar: 150, estado: 'activo'
    },
    {
      id: '2', nombre: 'React Básico', descripcion: 'Introducción a componentes y hooks',
      fechaInicio: '2026-08-01', fechaFin: '2026-09-01', cupoMaximo: 25, horas: 30,
      precioEstandar: 250, precioAuxiliar: 100, estado: 'archivado'
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState<'activo' | 'archivado' | 'todos'>('activo');
  const [modalOpen, setModalOpen] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);

  // Configuración de React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: cursoEditando || {}
  });

  // Abrir modal para crear
  const handleNuevoCurso = () => {
    setCursoEditando(null);
    reset({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', cupoMaximo: 0, horas: 0, precioEstandar: 0, precioAuxiliar: 0 });
    setModalOpen(true);
  };

  // Abrir modal para editar
  const handleEditar = (curso: Curso) => {
    setCursoEditando(curso);
    reset(curso);
    setModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const onSubmit = (data: CursoFormData) => {
    if (cursoEditando) {
      setCursos(cursos.map(c => c.id === cursoEditando.id ? { ...c, ...data } : c));
    } else {
      const nuevoCurso: Curso = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        estado: 'activo'
      };
      setCursos([...cursos, nuevoCurso]);
    }
    setModalOpen(false);
  };

  // Archivar / Desarchivar (Soft Delete)
  const toggleEstado = (id: string) => {
    setCursos(cursos.map(c => {
      if (c.id === id) {
        return { ...c, estado: c.estado === 'activo' ? 'archivado' : 'activo' };
      }
      return c;
    }));
  };

  // Filtrado
  const cursosFiltrados = cursos.filter(c => filtroEstado === 'todos' || c.estado === filtroEstado);

  return (
    <div className="bg-white rounded-xl border border-card-border shadow-sm w-full">
      {/* Encabezado y Filtros */}
      <div className="p-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-primary font-bold text-text-main">Gestión de Cursos</h2>
          <p className="text-text-muted font-secondary text-sm">Crea, edita y administra los cursos y sus atributos.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select 
            className="border border-input-border rounded-lg px-3 py-2 font-secondary text-sm text-text-main focus:outline-none focus:border-primary"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
          >
            <option value="activo">Solo Activos</option>
            <option value="archivado">Solo Archivados</option>
            <option value="todos">Todos los cursos</option>
          </select>
          <Button onClick={handleNuevoCurso} icon={<PlusCircle size={18} />}>
            Nuevo Curso
          </Button>
        </div>
      </div>

      {/* Tabla de Cursos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
              <th className="p-4 font-semibold">Curso</th>
              <th className="p-4 font-semibold">Fechas</th>
              <th className="p-4 font-semibold">Cupos / Hrs</th>
              <th className="p-4 font-semibold">Precios (Est/Aux)</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="font-secondary text-sm">
            {cursosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  No se encontraron cursos con este filtro.
                </td>
              </tr>
            ) : (
              cursosFiltrados.map((curso) => (
                <tr key={curso.id} className="border-b border-card-border hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-text-main">{curso.nombre}</p>
                    <p className="text-text-muted text-xs truncate max-w-[200px]">{curso.descripcion}</p>
                  </td>
                  <td className="p-4 text-text-main text-xs">
                    <div>Inicio: {curso.fechaInicio}</div>
                    <div>Fin: {curso.fechaFin}</div>
                  </td>
                  <td className="p-4 text-text-main text-xs">
                    <div>Cupos: {curso.cupoMaximo}</div>
                    <div>Horas: {curso.horas}h</div>
                  </td>
                  <td className="p-4 text-text-main text-xs">
                    <div>Bs. {curso.precioEstandar}</div>
                    <div className="text-text-muted">Bs. {curso.precioAuxiliar} (Aux)</div>
                  </td>
                  <td className="p-4">
                    <Badge variant={curso.estado === 'activo' ? 'success' : 'default'}>
                      {curso.estado === 'activo' ? 'Activo' : 'Archivado'}
                    </Badge>
                  </td>
                  <td className="p-4 flex space-x-2">
                    <button 
                      onClick={() => handleEditar(curso)}
                      className="p-1.5 text-primary hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => toggleEstado(curso.id)}
                      className={`p-1.5 rounded transition-colors ${curso.estado === 'activo' ? 'text-secondary hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      title={curso.estado === 'activo' ? 'Archivar' : 'Desarchivar'}
                    >
                      {curso.estado === 'activo' ? <Archive size={18} /> : <ArchiveRestore size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación/Edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-card-border sticky top-0 bg-white">
              <h3 className="text-xl font-primary font-bold text-text-main">
                {cursoEditando ? 'Editar Curso' : 'Crear Nuevo Curso'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-main">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-main font-secondary">Nombre del Curso</label>
                <input 
                  {...register('nombre')}
                  className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  placeholder="Ej. NodeJS Avanzado"
                />
                {errors.nombre && <p className="text-secondary text-xs">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-main font-secondary">Descripción</label>
                <textarea 
                  {...register('descripcion')}
                  className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  placeholder="Detalles del contenido del curso..."
                  rows={3}
                />
                {errors.descripcion && <p className="text-secondary text-xs">{errors.descripcion.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Fecha de Inicio</label>
                  <input 
                    type="date"
                    {...register('fechaInicio')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.fechaInicio && <p className="text-secondary text-xs">{errors.fechaInicio.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Fecha de Fin</label>
                  <input 
                    type="date"
                    {...register('fechaFin')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.fechaFin && <p className="text-secondary text-xs">{errors.fechaFin.message}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Cupo Máximo</label>
                  <input 
                    type="number"
                    {...register('cupoMaximo')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.cupoMaximo && <p className="text-secondary text-xs">{errors.cupoMaximo.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Horas Totales</label>
                  <input 
                    type="number"
                    {...register('horas')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.horas && <p className="text-secondary text-xs">{errors.horas.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Precio Estándar (Bs.)</label>
                  <input 
                    type="number"
                    {...register('precioEstandar')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.precioEstandar && <p className="text-secondary text-xs">{errors.precioEstandar.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main font-secondary">Precio Auxiliares (Bs.)</label>
                  <input 
                    type="number"
                    {...register('precioAuxiliar')}
                    className="w-full border border-input-border rounded-lg px-3 py-2 font-secondary text-sm focus:border-primary focus:outline-none"
                  />
                  {errors.precioAuxiliar && <p className="text-secondary text-xs">{errors.precioAuxiliar.message}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-card-border mt-6">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {cursoEditando ? 'Guardar Cambios' : 'Crear Curso'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}