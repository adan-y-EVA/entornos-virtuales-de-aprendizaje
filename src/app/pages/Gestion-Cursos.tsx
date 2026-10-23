'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../components/Button';
import { CursoTable } from '../components/courses/CursoTable';
import { RevisionAperturaModal } from '../components/apertura/RevisionAperturaModal';
import { CursoFormModal, type CursoFormData, type CursoData, type InstructorData } from '../components/courses/CursoModal'; 

export function GestionCursos() {
  const [cursos, setCursos] = useState<CursoData[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVO' | 'CERRADO' | 'todos'>('ACTIVO');
  const [instructores, setInstructores] = useState<InstructorData[]>([])
  
  const [cargando, setCargando] = useState(true); 
  
  const [modalOpen, setModalOpen] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<CursoData | null>(null);
  const [revisando, setRevisando] = useState<string | null>(null);

  const { call } = useApi();

  const refetchCursos = async () => {
    const res = await call<CursoData[]>('/api/cursos');
    if (res?.ok) setCursos(res.data);
  };

  useEffect(() => {
    let montado = true;

    const fetchInicial = async () => {
      const [resCursos, resInstructores] = await Promise.all([
        call<CursoData[]>('/api/cursos'),
        call<InstructorData[]>('/api/instructores'),
      ]);

      if (montado) {
        if (resCursos?.ok) setCursos(resCursos.data);
        if (resInstructores?.ok) setInstructores(resInstructores.data);
        setCargando(false);
      }
    };

    fetchInicial();

    return () => { montado = false; };
  }, [call]);

  const handleNuevoCurso = () => {
    setCursoEditando(null);
    setModalOpen(true);
  };

  const handleEditar = (curso: CursoData) => {
    setCursoEditando(curso);
    setModalOpen(true);
  };

  const handleGuardar = async (data: CursoFormData) => {
    const url = cursoEditando ? `/api/cursos/${cursoEditando.codigo}` : '/api/cursos';
    const method = cursoEditando ? 'PUT' : 'POST';

    const res = await call<{ curso: CursoData }>(url, { method, body: data });
    if (!res?.ok) return;

    await refetchCursos();
    setModalOpen(false);
    toast.success(cursoEditando ? "Curso actualizado correctamente." : "Curso creado correctamente.");
  };

  const handleArchivar = async (codigo: string, estadoActual: string) => {
    const res = await call<{ curso: CursoData }>(`/api/cursos/${codigo}`, {
      method: 'PATCH',
      body: { estadoActual: estadoActual || 'ACTIVO' },
    });
    if (!res?.ok) return;

    await refetchCursos();
    toast.success("Estado del curso actualizado correctamente.");
  };

  const cursosFiltrados = cursos.filter(c => 
    filtroEstado === 'todos' || (c.estado || 'ACTIVO') === filtroEstado
  );

  return (
    <div className="bg-white rounded-xl border border-card-border shadow-sm w-full">
      {/* Header y Filtros */}
      <div className="p-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-primary font-bold text-text-main">Gestión de Cursos</h2>
          <p className="text-text-muted font-secondary text-sm">Crea, edita y administra los cursos.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select 
            className="border border-input-border rounded-lg px-3 py-2 font-secondary text-sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'ACTIVO' | 'CERRADO' | 'todos')}
          >
            <option value="ACTIVO">Solo Activos</option>
            <option value="CERRADO">Solo Cerrados</option>
            <option value="todos">Todos</option>
          </select>
          <Button onClick={handleNuevoCurso} icon={<PlusCircle size={18} />}>
            Nuevo Curso
          </Button>
        </div>
      </div>

      {/* Componente Tabla (Presentacional) */}
      <CursoTable 
        cursos={cursosFiltrados} 
        cargando={cargando} 
        onEdit={handleEditar} 
        onArchivar={handleArchivar} 
        onRevisarApertura={setRevisando}
      />

      {revisando && (
        <RevisionAperturaModal
          key={revisando}
          codigo={revisando}
          onClose={() => setRevisando(null)}
          onRevisado={refetchCursos}
        />
      )}

      {/* Componente Modal (Presentacional + Form) */}
      <CursoFormModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleGuardar} 
        cursoEditando={cursoEditando} 
        instructores={instructores}
      />
    </div>
  );
}