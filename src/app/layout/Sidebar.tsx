'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, Users, Award, Calendar, 
  CheckCircle, LogOut 
} from 'lucide-react';

export function Sidebar() {
  // hook de Next.js para saber en qué URL estamos actualmente
  const pathname = usePathname();

  // Lista de rutas para renderizarlas dinámicamente
  const menuItems = [
    { nombre: 'Inicio', ruta: '/', icono: <BookOpen size={20} /> },
    { nombre: 'Cursos y Horarios', ruta: '/cursos', icono: <Calendar size={20} /> },
    { nombre: 'Inscripciones', ruta: '/inscripciones', icono: <Users size={20} /> },
    { nombre: 'Asistencia y Notas', ruta: '/asistencia', icono: <CheckCircle size={20} /> },
    { nombre: 'Certificados', ruta: '/certificados', icono: <Award size={20} /> },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col hidden md:flex min-h-screen sticky top-0">
      {/* Título / Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-primary font-bold">Laboratorios Sistemas Informatica UMSS</h1>
        <p className="text-sm font-secondary text-gray-300 mt-1">CS - UMSS</p>
      </div>
      
      {/* Navegación principal */}
      <nav className="flex-1 px-4 space-y-2 mt-4 font-secondary">
        {menuItems.map((item) => {
          // Comprobamos si la ruta actual coincide con la del botón
          const isActive = pathname === item.ruta;
          
          return (
            <Link 
              key={item.ruta} 
              href={item.ruta}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-secondary text-white font-bold' 
                  : 'hover:bg-[#1a5b9c] text-gray-100'
              }`}
            >
              {item.icono}
              <span>{item.nombre}</span>
            </Link>
          );
        })}
      </nav>

      {/* Botón de Cerrar Sesión fijo abajo */}
      <div className="p-4 border-t border-[#1a5b9c]">
        <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-[#1a5b9c] rounded-lg transition-colors font-secondary text-gray-100">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}