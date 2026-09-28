import { NextResponse } from "next/server";
import { CursoService } from "./courses.service";

export async function GET() {
  try {
    const cursos = await CursoService.getAll();
    return NextResponse.json(cursos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener los cursos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const nuevoCurso = await CursoService.create(body);
    return NextResponse.json({ ok: true, curso: nuevoCurso }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el curso. Verifica si el código o el CI del instructor son válidos." }, 
      { status: 400 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { codigo: string } }) {
  try {
    const body = await request.json().catch(() => null);
    const cursoActualizado = await CursoService.update(params.codigo, body);
    
    return NextResponse.json({ ok: true, curso: cursoActualizado });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo actualizar el curso" }, { status: 400 });
  }
}

// PATCH exclusivo para cambiar el estado (Archivar)
export async function PATCH(request: Request, { params }: { params: { codigo: string } }) {
  try {
    const body = await request.json().catch(() => null);
    const cursoModificado = await CursoService.toggleEstado(params.codigo, body.estadoActual);
    
    return NextResponse.json({ ok: true, curso: cursoModificado });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo archivar el curso" }, { status: 400 });
  }
}