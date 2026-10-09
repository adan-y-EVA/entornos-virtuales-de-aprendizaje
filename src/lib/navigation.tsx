'use client';

import type { ReactNode } from 'react';
import type { Rol } from '@/src/context/AuthContext';
import { BookOpen, Calendar, Users, CheckCircle, Award, Briefcase } from 'lucide-react';

export interface MenuItem {
  nombre: string;
  ruta: string;
  icono: ReactNode;
  disabled?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  { nombre: 'Inicio', ruta: '/', icono: <BookOpen size={20} /> },
  { nombre: 'Cursos y Horarios', ruta: '/cursos', icono: <Calendar size={20} /> },
  { nombre: 'Inscripciones', ruta: '/inscripciones', icono: <Users size={20} /> },
  { nombre: 'Asistencia y Notas', ruta: '/asistencia', icono: <CheckCircle size={20} />, disabled: true },
  { nombre: 'Certificados', ruta: '/certificados', icono: <Award size={20} />, disabled: true },
  { nombre: 'Instructores', ruta: '/instructores', icono: <Briefcase size={20} /> },
];

export const ROLE_MENU: Record<Rol, string[]> = {
  ADMIN: ['/', '/cursos', '/inscripciones', '/asistencia', '/certificados', '/instructores'],
  INSTRUCTOR: ['/', '/cursos', '/inscripciones', '/asistencia', '/certificados'],
  ESTUDIANTE: ['/'],
};

export function getMenuForRole(role: Rol): MenuItem[] {
  const allowedPaths = ROLE_MENU[role];
  return MENU_ITEMS.filter((item) => allowedPaths.includes(item.ruta)).map((item) => ({
    ...item,
    nombre: role === 'ESTUDIANTE' && item.ruta === '/' ? 'Mi Dashboard' : item.nombre,
    ruta: role === 'ESTUDIANTE' && item.ruta === '/' ? '/dashboard/estudiante' : item.ruta,
  }));
}
