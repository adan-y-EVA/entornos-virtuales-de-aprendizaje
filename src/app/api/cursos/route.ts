import { CursoService } from "./courses.service";
import { logger } from "@/src/lib/logger";
import { ok, created, fail } from "@/src/lib/api-response";

export async function GET() {
  try {
    const cursos = await CursoService.getAll();
    return ok(cursos);
  } catch (error) {
    logger.error("GET /api/cursos", { error: error instanceof Error ? error.message : String(error) });
    return fail("Error al obtener los cursos", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const nuevoCurso = await CursoService.create(body);
    return created({ curso: nuevoCurso });
  } catch (error) {
    logger.warn("POST /api/cursos", { error: error instanceof Error ? error.message : String(error) });
    return fail("No se pudo crear el curso. Verifica si el código o el CI del instructor son válidos.", 400);
  }
}
