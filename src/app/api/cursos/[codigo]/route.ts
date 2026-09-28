import { NextRequest, NextResponse } from "next/server";
import { CursoService } from "../courses.service";

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
