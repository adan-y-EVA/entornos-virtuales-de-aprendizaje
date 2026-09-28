// src/app/cursos/page.tsx
import React from 'react';
import { GestionCursos } from '../pages/Gestion-Cursos'; // Ajusta la ruta si es necesario

export default function PaginaCursos() {
  return (
    <div className="p-6 w-full h-full">
      {/* Aquí simplemente mandamos a llamar a nuestro componente gigante */}
      <GestionCursos />
    </div>
  );
}