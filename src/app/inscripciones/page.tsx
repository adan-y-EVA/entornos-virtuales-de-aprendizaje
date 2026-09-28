import DashboardInscripciones, {
  type CursoOption,
  type ResumenInscripciones,
} from '../pages/Dashboard-Inscripciones';
import { obtenerCurso } from '@/src/lib/inscripciones';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PaginaInscripciones() {
  const registros = await prisma.curso.findMany({ orderBy: { codigo: 'asc' } });

  const cursos: CursoOption[] = (
    await Promise.all(registros.map((registro) => obtenerCurso(registro.codigo)))
  ).filter((curso): curso is NonNullable<typeof curso> => curso !== null);

  const totalInscritos = await prisma.inscripcion.count({ where: { estado: 'INSCRITO' } });

  const resumen: ResumenInscripciones = {
    cursosAbiertos: cursos.filter((curso) => curso.abiertos).length,
    totalInscritos,
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans">
      <DashboardInscripciones cursos={cursos} resumen={resumen} />
    </div>
  );
}
