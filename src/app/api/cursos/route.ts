import { NextResponse } from "next/server";
import { CursoService } from "./courses.service";

export async function GET() {
  try {
    const cursos = await CursoService.getAll();
    return NextResponse.json(cursos, { status: 200 });
  } catch {
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
