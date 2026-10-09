'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Search, Briefcase } from 'lucide-react';
import { Button } from '../components/Button';

const instructorSchema = z.object({
  ci: z.string().min(5, "CI inválido"),
  nombres: z.string().min(2, "Requerido"),
  apellidos: z.string().min(2, "Requerido"),
  email: z.string().email("Correo inválido"),
  especialidad: z.string().min(3, "Requerido"),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

interface InstructorResumen {
  ci: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: string;
}

export default function PaginaInstructores() {
  const [instructores, setInstructores] = useState<InstructorResumen[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true); // Inicia en true por defecto
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema)
  });

  const cargarInstructores = async () => {
    // Ya no hacemos setCargando(true) aquí para evitar el error del useEffect
    try {
      const res = await fetch('/api/instructores');
      if (res.ok) setInstructores(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      // Esto es asíncrono, así que a React no le molesta
      setCargando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    cargarInstructores();
  }, []);

  const onSubmit = async (data: InstructorFormData) => {
    try {
      const res = await fetch('/api/instructores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setModalAbierto(false);
        reset();
        // Activamos la carga manualmente solo cuando vamos a recargar la tabla tras guardar
        setCargando(true); 
        cargarInstructores(); 
      } else {
        const error = await res.json();
        alert(error.error || "Error al guardar");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-primary font-bold text-text-main">Instructores</h1>
          <p className="text-text-muted text-sm mt-1">Gestión del personal docente</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setModalAbierto(true)}>
          Nuevo Instructor
        </Button>
      </div>

      <div className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" placeholder="Buscar por CI o Apellido..." className="pl-10 pr-4 py-2 border border-input-border rounded-lg text-sm w-72 focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-text-muted font-secondary text-sm border-b border-card-border">
              <tr>
                <th className="p-4 font-semibold">CI</th>
                <th className="p-4 font-semibold">Instructor</th>
                <th className="p-4 font-semibold">Correo Electrónico</th>
                <th className="p-4 font-semibold">Especialidad</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={4} className="p-8 text-center text-text-muted">Cargando...</td></tr>
              ) : instructores.map((inst) => (
                <tr key={inst.ci} className="border-b border-card-border hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-mono text-text-muted">{inst.ci}</td>
                  <td className="p-4 text-sm font-bold text-text-main">{inst.apellido}, {inst.nombre}</td>
                  <td className="p-4 text-sm text-text-muted">{inst.email}</td>
                  <td className="p-4 text-sm text-text-main">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      <Briefcase size={12} /> {inst.especialidad}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-card-border bg-gray-50">
              <h3 className="text-lg font-primary font-bold text-text-main">Registrar Instructor</h3>
              <button onClick={() => setModalAbierto(false)} className="text-text-muted hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Carnet de Identidad</label>
                  <input {...register('ci')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  {errors.ci && <p className="text-red-500 text-xs">{errors.ci.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Especialidad</label>
                  <input {...register('especialidad')} placeholder="Ej: Redes, Base de Datos..." className="w-full border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  {errors.especialidad && <p className="text-red-500 text-xs">{errors.especialidad.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Nombres</label>
                  <input {...register('nombres')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  {errors.nombres && <p className="text-red-500 text-xs">{errors.nombres.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Apellidos</label>
                  <input {...register('apellidos')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  {errors.apellidos && <p className="text-red-500 text-xs">{errors.apellidos.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main">Correo Electrónico</label>
                <input type="email" {...register('email')} className="w-full border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <p className="text-xs text-text-muted italic pt-2">Nota: La contraseña inicial del instructor será su Carnet de Identidad.</p>

              <div className="flex justify-end space-x-3 pt-4 border-t border-card-border mt-6">
                <Button type="button" variant="outline" onClick={() => setModalAbierto(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Registrar Instructor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}