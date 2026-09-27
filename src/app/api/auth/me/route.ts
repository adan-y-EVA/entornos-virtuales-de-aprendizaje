import { NextResponse } from "next/server";
import { verifySession } from "../../../../lib/auth";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      ci: session.sub,
      email: session.email,
      role: session.role,
      nombre: session.nombre,
    },
  });
}
