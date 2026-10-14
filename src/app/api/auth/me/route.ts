import { verifySession } from "../../../../lib/auth";
import { ok, unauthorized } from "@/src/lib/api-response";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return unauthorized();
  }

  return ok({
    user: {
      ci: session.sub,
      email: session.email,
      role: session.role,
      nombre: session.nombre,
    },
  });
}
