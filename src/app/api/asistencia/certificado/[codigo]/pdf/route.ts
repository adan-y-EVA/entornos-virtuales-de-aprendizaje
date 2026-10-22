import { type NextRequest } from "next/server";
import { logger } from "@/src/lib/logger";
import { fail, notFound } from "@/src/lib/api-response";
import { obtenerCertificadoParaVerificacion, generarPDFCertificado } from "@/src/lib/certificados";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  try {
    const { codigo } = await params;
    const certificado = await obtenerCertificadoParaVerificacion(codigo);
    if (!certificado) return notFound("Certificado no encontrado.");

    // Solo certificados emitidos (no PENDIENTE) generan PDF.
    if (certificado.tipo !== "APROBADO" && certificado.tipo !== "ASISTENCIA") {
      return notFound("El certificado aún no ha sido emitido.");
    }

    const pdf = await generarPDFCertificado(certificado);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${certificado.codigoVerificacion}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("GET /api/asistencia/certificado/[codigo]/pdf", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudo generar el PDF.", 500);
  }
}
