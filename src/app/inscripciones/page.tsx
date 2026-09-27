import DashboardInscripciones, {
  type CursoOption,
  type ResumenInscripciones,
} from '../pages/Dashboard-Inscripciones';
import { obtenerCurso } from '@/src/lib/inscripciones';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

function hoy(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export default async function PaginaInscripciones() {
  const registros = await prisma.curso.findMany({ orderBy: { codigo: 'asc' } });

  const cursos: CursoOption[] = (
    await Promise.all(registros.map((registro) => obtenerCurso(registro.codigo)))
  ).filter((curso): curso is NonNullable<typeof curso> => curso !== null);

  const inicioHoy = hoy();
  const finHoy = new Date(inicioHoy);
  finHoy.setDate(finHoy.getDate() + 1);

  const [inscritosHoy, totalInscritos] = await Promise.all([
    prisma.inscripcion.count({
      where: { fechaInscripcion: { gte: inicioHoy, lt: finHoy } },
    }),
    prisma.inscripcion.count({ where: { estado: 'INSCRITO' } }),
  ]);

  const resumen: ResumenInscripciones = {
    cursosAbiertos: cursos.filter((curso) => curso.abiertos).length,
    inscritosHoy,
    totalInscritos,
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans">
      <DashboardInscripciones cursos={cursos} resumen={resumen} />
    </div>
  );
}
