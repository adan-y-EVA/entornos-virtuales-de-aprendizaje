'use client';

import React from 'react';
import { Search, BookOpen, Calendar, Award, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';

export interface CursoInscrito {
  codigo: string;
  nombre: string;
  instructor: string;
  horario: string;
  horas: number;
  avance: number;
  estado: 'activo' | 'finalizado' | 'pre-inscripcion';
}

export interface CertificadoEstudiante {
  id: string;
  codigo: string;
  curso: string;
  nota: number | null;
  asistencia: number;
  fecha: string;
  estado: 'aprobado' | 'pendiente';
}

interface DashboardStudentProps {
  nombre?: string;
  estadisticas?: {
    cursosActivos: number;
    horasCursadas: number;
    asistenciaPromedio: number;
    certificados: number;
  };
  cursos?: CursoInscrito[];
  certificados?: CertificadoEstudiante[];
}

export default function DashboardStudentView({
  nombre = 'estudiante',
  estadisticas = { cursosActivos: 0, horasCursadas: 0, asistenciaPromedio: 0, certificados: 0 },
  cursos = [],
  certificados = [],
}: DashboardStudentProps) {
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <header className="bg-white border-b border-card-border p-4 flex justify-between items-center w-full">
        <div>
          <h2 className="text-2xl font-primary font-bold text-text-main">
            Hola, {nombre}
          </h2>
          <p className="font-secondary text-sm text-text-muted">
            Panel del estudiante
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar mis cursos..."
              className="pl-10 pr-4 py-2 border border-input-border rounded-lg text-sm w-64"
            />
          </div>
        </div>
      </header>

      <main className="p-6 flex-1 w-full overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full">
          <StatCard
            title="Cursos Activos"
            value={estadisticas.cursosActivos}
            icon={<BookOpen />}
            iconBgClass="bg-blue-100"
            iconTextClass="text-primary"
          />
          <StatCard
            title="Horas Cursadas"
            value={estadisticas.horasCursadas}
            icon={<Clock />}
            iconBgClass="bg-yellow-100"
            iconTextClass="text-yellow-700"
          />
          <StatCard
            title="Asistencia Promedio"
            value={`${estadisticas.asistenciaPromedio}%`}
            icon={<CheckCircle />}
            iconBgClass="bg-green-100"
            iconTextClass="text-green-700"
          />
          <StatCard
            title="Certificados"
            value={estadisticas.certificados}
            icon={<Award />}
            iconBgClass="bg-red-100"
            iconTextClass="text-secondary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-primary font-bold text-text-main">Mis Cursos</h3>
              <Button variant="outline" size="sm" icon={<Calendar size={16} />}>
                Ver Horario
              </Button>
            </div>

            <div className="bg-white border border-card-border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
                  <tr>
                    <th className="p-4">Curso</th>
                    <th className="p-4">Instructor</th>
                    <th className="p-4">Avance</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-text-muted">
                        No estas inscrito en ningun curso aun.
                      </td>
                    </tr>
                  ) : (
                    cursos.map((curso) => (
                      <tr key={curso.codigo} className="border-b border-card-border hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-bold text-text-main">{curso.nombre}</p>
                          <p className="text-text-muted text-xs">
                            {curso.codigo} &middot; {curso.horas} horas &middot; {curso.horario}
                          </p>
                        </td>
                        <td className="p-4 text-text-main text-sm">{curso.instructor}</td>
                        <td className="p-4">
                          <div className="w-28">
                            <div className="h-2 rounded-full bg-card-bg overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${curso.avance}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted">{curso.avance}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              curso.estado === 'activo'
                                ? 'success'
                                : curso.estado === 'finalizado'
                                  ? 'default'
                                  : 'warning'
                            }
                          >
                            {curso.estado === 'activo'
                              ? 'Activo'
                              : curso.estado === 'finalizado'
                                ? 'Finalizado'
                                : 'Pre-inscripcion'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-xl font-primary font-bold text-text-main mb-4">
              Mis Certificados
            </h3>
            <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-4">
              {certificados.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-4">
                  Aun no tienes certificados.
                </p>
              ) : (
                certificados.map((cert) => (
                  <div key={cert.id} className="bg-white p-4 rounded-lg border border-card-border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={`flex items-center space-x-1 ${
                          cert.estado === 'aprobado' ? 'text-green-600' : 'text-yellow-600'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span className="text-xs font-bold uppercase">{cert.estado}</span>
                      </div>
                      <span className="text-xs text-text-muted font-mono">Cod: {cert.codigo}</span>
                    </div>
                    <h4 className="font-primary font-bold text-text-main">{cert.curso}</h4>
                    <div className="flex justify-between items-center pt-3 border-t border-card-border mt-2">
                      <p className="text-xs text-text-muted">
                        {cert.nota !== null ? `Nota: ${cert.nota}/100 | ` : ''}
                        Asist: {cert.asistencia}%
                      </p>
                      <span className="text-xs text-text-muted">{cert.fecha}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
