import { type NextRequest } from "next/server";
import { logger } from "@/src/lib/logger";
import { ok, fail, notFound } from "@/src/lib/api-response";
import { obtenerCertificadoParaVerificacion } from "@/src/lib/certificados";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  try {
    const { codigo } = await params;
    const certificado = await obtenerCertificadoParaVerificacion(codigo);
    if (!certificado) return notFound("Certificado no encontrado.");
    return ok(certificado);
  } catch (error) {
    logger.error("GET /api/asistencia/certificado/[codigo]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo cargar el certificado.", 500);
  }
}
