'use client';

import React from 'react';
import { PlusCircle, Search, LogOut, CheckCircle, FileText, Award, BookOpen, Clock, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';

export interface Curso {
  id: string;
  nombre: string;
  horas: number;
  horario: string;
  instructor: string;
  inscritos: number;
  estado: 'activo' | 'pre-inscripcion';
}

export interface Certificado {
  id: string;
  codigo: string;
  alumno: string;
  curso: string;
  horas: number;
  nota: number;
  asistencia: number;
  estado: 'aprobado' | 'pendiente';
}

interface DashboardProps {
  estadisticas?: {
    activos: number;
    preInscritos: number;
    alumnos: number;
    certificados: number;
  };
  cursos?: Curso[];
  certificados?: Certificado[];
}

export default function DashboardView({ 
  estadisticas = { activos: 0, preInscritos: 0, alumnos: 0, certificados: 0 },
  cursos = [], 
  certificados = [] 
}: DashboardProps) {
  
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header simplificado para este ejemplo */}
      <header className="bg-white border-b border-card-border p-4 flex justify-between items-center w-full">
        <h2 className="text-2xl font-primary font-bold text-text-main">Panel de Control</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-10 pr-4 py-2 border border-input-border rounded-lg text-sm w-64"
            />
          </div>
          <Button variant="outline" icon={<LogOut size={16} />}>Salir</Button>
        </div>
      </header>

      <main className="p-6 flex-1 w-full overflow-x-hidden">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full">
          <StatCard title="Cursos Activos" value={estadisticas.activos} icon={<BookOpen />} iconBgClass="bg-blue-100" iconTextClass="text-primary" />
          <StatCard title="Pre-inscritos" value={estadisticas.preInscritos} icon={<Clock />} iconBgClass="bg-yellow-100" iconTextClass="text-yellow-700" />
          <StatCard title="Alumnos Regulares" value={estadisticas.alumnos} icon={<Users />} iconBgClass="bg-green-100" iconTextClass="text-green-700" />
          <StatCard title="Certificados Emitidos" value={estadisticas.certificados} icon={<Award />} iconBgClass="bg-red-100" iconTextClass="text-secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tabla de Cursos Dinámica */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-primary font-bold text-text-main">Cursos</h3>
              <Button icon={<PlusCircle size={18} />}>Lanzar Nuevo Curso</Button>
            </div>
            
            <div className="bg-white border border-card-border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
                  <tr>
                    <th className="p-4">Curso</th>
                    <th className="p-4">Instructor</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-text-muted">No hay cursos registrados.</td></tr>
                  ) : (
                    cursos.map((curso) => (
                      <tr key={curso.id} className="border-b border-card-border hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-bold text-text-main">{curso.nombre}</p>
                          <p className="text-text-muted text-xs">{curso.horas} horas • {curso.horario}</p>
                        </td>
                        <td className="p-4 text-text-main text-sm">{curso.instructor}</td>
                        <td className="p-4">
                          <Badge variant={curso.estado === 'activo' ? 'success' : 'warning'}>
                            {curso.inscritos} {curso.estado === 'activo' ? 'Activos' : 'Pre-inscritos'}
                          </Badge>
                        </td>
                        <td className="p-4 flex space-x-2">
                          {curso.estado === 'activo' ? (
                            <>
                              <Button variant="outline" size="sm">Asistencia</Button>
                              <Button variant="outline" size="sm">Notas</Button>
                            </>
                          ) : (
                            <Button variant="primary" size="sm">Validar Caja</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista de Certificados Dinámica */}
          <div className="col-span-1">
            <h3 className="text-xl font-primary font-bold text-text-main mb-4">Últimos Certificados</h3>
            <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-4">
              
              {certificados.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-4">No hay certificados recientes.</p>
              ) : (
                certificados.map((cert) => (
                  <div key={cert.id} className="bg-white p-4 rounded-lg border border-card-border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`flex items-center space-x-1 ${cert.estado === 'aprobado' ? 'text-green-600' : 'text-yellow-600'}`}>
                        <CheckCircle size={14} />
                        <span className="text-xs font-bold uppercase">{cert.estado}</span>
                      </div>
                      <span className="text-xs text-text-muted font-mono">Cod: {cert.codigo}</span>
                    </div>
                    <h4 className="font-primary font-bold text-text-main">{cert.alumno}</h4>
                    <p className="text-sm font-secondary text-text-muted mb-3">Curso: {cert.curso} ({cert.horas} hrs)</p>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-card-border mt-2">
                      <p className="text-xs text-text-muted">Nota: {cert.nota}/100 • Asist: {cert.asistencia}%</p>
                      {cert.estado === 'aprobado' ? (
                        <Button variant="ghost" size="sm" icon={<FileText size={14} />}>PDF</Button>
                      ) : (
                        <Button variant="ghost" size="sm" icon={<Award size={14} />}>Emitir</Button>
                      )}
                    </div>
                  </div>
                ))
              )}

              <Button variant="ghost" className="w-full">Ver todos</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}