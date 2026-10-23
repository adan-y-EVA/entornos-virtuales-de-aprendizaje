import { NextRequest } from "next/server";
import { CursoService, ErrorValidacionCurso } from "../courses.service";
import { logger } from "@/src/lib/logger";
import { ok, fail, notFound } from "@/src/lib/api-response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const curso = await CursoService.getByCodigo(codigo);

    if (!curso) {
      return notFound(`El curso ${codigo} no existe`);
    }

    return ok(curso);
  } catch (error) {
    logger.error("GET /api/cursos/[codigo]", { error: error instanceof Error ? error.message : String(error) });
    return fail("No se pudo obtener el curso", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const body = await request.json().catch(() => null);
    const cursoActualizado = await CursoService.update(codigo, body);

    return ok({ curso: cursoActualizado });
  } catch (error) {
    if (error instanceof ErrorValidacionCurso) return fail(error.message, 400);
    logger.warn("PUT /api/cursos/[codigo]", { error: error instanceof Error ? error.message : String(error) });
    return fail("No se pudo actualizar el curso", 400);
  }
}

// PATCH exclusivo para cambiar el estado (Archivar)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const body = await request.json().catch(() => null);
    const cursoModificado = await CursoService.toggleEstado(codigo, body.estadoActual);

    return ok({ curso: cursoModificado });
  } catch (error) {
    logger.warn("PATCH /api/cursos/[codigo]", { error: error instanceof Error ? error.message : String(error) });
    return fail("No se pudo archivar el curso", 400);
  }
}
