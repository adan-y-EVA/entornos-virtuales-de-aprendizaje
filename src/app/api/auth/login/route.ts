import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createSession, verifyPassword, type Rol } from "../../../../lib/auth";
import { loginSchema } from "../../../../lib/validations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos. Revisa el correo y la contrasena." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { roles: { include: { rol: true } } },
  });

  if (!usuario || !verifyPassword(password, usuario.passwordHash)) {
    return NextResponse.json(
      { error: "Credenciales invalidas." },
      { status: 401 },
    );
  }

  const rol = usuario.roles[0]?.rol.nombre as Rol | undefined;
  if (!rol) {
    return NextResponse.json(
      { error: "El usuario no tiene un rol asignado." },
      { status: 403 },
    );
  }

  await createSession({
    sub: usuario.ci,
    email: usuario.email,
    role: rol,
    nombre: `${usuario.nombres} ${usuario.apellidos}`,
  });

  return NextResponse.json({
    ok: true,
    user: { ci: usuario.ci, email: usuario.email, role: rol },
  });
}
