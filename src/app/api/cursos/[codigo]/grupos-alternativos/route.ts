import { type NextRequest } from "next/server";
import { verifySession } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { ok, fail, unauthorized } from "@/src/lib/api-response";
import { ErrorApertura, getGruposAlternativos } from "@/src/lib/apertura";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  try {
    const { codigo } = await params;
    const grupos = await getGruposAlternativos(codigo, { ci: session.sub, role: session.role });
    return ok(grupos);
  } catch (error) {
    if (error instanceof ErrorApertura) return fail(error.message, 400);
    logger.error("GET /api/cursos/[codigo]/grupos-alternativos", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("No se pudieron obtener los grupos alternativos.", 500);
  }
}
