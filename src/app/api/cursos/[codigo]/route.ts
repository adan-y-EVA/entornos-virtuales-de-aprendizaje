import { NextRequest, NextResponse } from "next/server";
import { CursoService } from "../courses.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const curso = await CursoService.getByCodigo(codigo);

    if (!curso) {
      return NextResponse.json({ error: `El curso ${codigo} no existe` }, { status: 404 });
    }

    return NextResponse.json(curso);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    return NextResponse.json({ error: "No se pudo obtener el curso" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const body = await request.json().catch(() => null);
    const cursoActualizado = await CursoService.update(codigo, body);
    
    return NextResponse.json({ ok: true, curso: cursoActualizado });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el curso" }, { status: 400 });
  }
}

// PATCH exclusivo para cambiar el estado (Archivar)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const body = await request.json().catch(() => null);
    const cursoModificado = await CursoService.toggleEstado(codigo, body.estadoActual);
    
    return NextResponse.json({ ok: true, curso: cursoModificado });
  } catch {
    return NextResponse.json({ error: "No se pudo archivar el curso" }, { status: 400 });
  }
}
