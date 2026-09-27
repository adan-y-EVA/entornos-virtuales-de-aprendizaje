import { NextResponse } from "next/server";
import {
  ErrorInscripcion,
  registrarInscripcion,
  validarCamposFormulario,
} from "@/src/lib/inscripciones";

export async function POST(request: Request) {
  let cuerpo: Record<string, unknown>;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la petición no es JSON válido." },
      { status: 400 },
    );
  }

  const errores = validarCamposFormulario(cuerpo);
  if (errores.length > 0) {
    return NextResponse.json(
      { error: errores[0].mensaje, columna: errores[0].columna },
      { status: 400 },
    );
  }

  if (typeof cuerpo.codigoCurso !== "string" || !cuerpo.codigoCurso.trim()) {
    return NextResponse.json(
      { error: "El curso es obligatorio.", columna: "codigoCurso" },
      { status: 400 },
    );
  }

  try {
    const resultado = await registrarInscripcion({
      ciEstudiante: String(cuerpo.ciEstudiante),
      nombres: String(cuerpo.nombres),
      apellidos: String(cuerpo.apellidos),
      codigoCurso: cuerpo.codigoCurso.trim(),
      tipoPrecio: String(cuerpo.tipoPrecio),
      codigoSis: cuerpo.codigoSis ? String(cuerpo.codigoSis) : undefined,
      email: cuerpo.email ? String(cuerpo.email) : undefined,
      celular: cuerpo.celular ? String(cuerpo.celular) : undefined,
      fotocopiaCi: cuerpo.fotocopiaCi === true,
    });

    return NextResponse.json({ ok: true, inscripcion: resultado }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorInscripcion) {
      return NextResponse.json(
        { error: error.message, columna: error.columna },
        { status: 409 },
      );
    }

    console.error("Error al inscribir:", error);
    return NextResponse.json(
      { error: "No se pudo completar la inscripción." },
      { status: 500 },
    );
  }
}
