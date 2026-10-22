import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorAsistencia } from "@/src/lib/asistencia";
import { finalizarCertificados } from "@/src/lib/certificados";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const resultado = await finalizarCertificados(codigo, {
      ci: session.sub,
      role: session.role,
    });
    return ok(resultado);
  } catch (error) {
    if (error instanceof ErrorAsistencia) return fail(error.message, 400);
    logger.error("POST /api/asistencia/curso/[codigo]/certificados", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron emitir los certificados.", 500);
  }
}
