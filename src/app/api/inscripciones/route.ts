import { logger } from "@/src/lib/logger";
import { created, fail } from "@/src/lib/api-response";
import {
  ErrorInscripcion,
  registrarInscripcion,
  validarCamposFormulario,
} from "@/src/lib/inscripciones";

function texto(valor: unknown): string | undefined {
  return valor === undefined || valor === null ? undefined : String(valor);
}

export async function POST(request: Request) {
  let cuerpo: Record<string, unknown>;

  try {
    cuerpo = await request.json();
  } catch {
    return fail("El cuerpo de la petición no es JSON válido.", 400);
  }

  const errores = validarCamposFormulario(cuerpo);
  if (errores.length > 0) {
    return fail(errores[0].mensaje, 400, { columna: errores[0].columna });
  }

  if (typeof cuerpo.codigoCurso !== "string" || !cuerpo.codigoCurso.trim()) {
    return fail("El curso es obligatorio.", 400, { columna: "codigoCurso" });
  }

  try {
    const resultado = await registrarInscripcion({
      ciEstudiante: String(cuerpo.ciEstudiante),
      nombres: String(cuerpo.nombres),
      apellidos: String(cuerpo.apellidos),
      codigoCurso: cuerpo.codigoCurso.trim(),
      tipoPrecio: String(cuerpo.tipoPrecio),
      estadoPago: texto(cuerpo.estadoPago),
      montoFisico: texto(cuerpo.montoFisico),
      montoQr: texto(cuerpo.montoQr),
      codigoSis: cuerpo.codigoSis ? String(cuerpo.codigoSis) : undefined,
      email: cuerpo.email ? String(cuerpo.email) : undefined,
      celular: cuerpo.celular ? String(cuerpo.celular) : undefined,
      fotocopiaCi: cuerpo.fotocopiaCi === true,
    });

    return created({ inscripcion: resultado });
  } catch (error) {
    if (error instanceof ErrorInscripcion) {
      return fail(error.message, 409, { columna: error.columna });
    }

    logger.error("POST /api/inscripciones", { error: error instanceof Error ? error.message : String(error) });
    return fail("No se pudo completar la inscripción.", 500);
  }
}
