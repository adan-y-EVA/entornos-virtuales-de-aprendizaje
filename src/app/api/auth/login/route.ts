import { prisma } from "../../../../lib/prisma";
import { createSession, verifyPassword, type Rol } from "../../../../lib/auth";
import { loginSchema } from "../../../../lib/validations";
import { ok, fail, unauthorized, forbidden } from "@/src/lib/api-response";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Datos invalidos. Revisa el correo y la contrasena.", 400);
  }

  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { roles: { include: { rol: true } } },
  });

  if (!usuario || !verifyPassword(password, usuario.passwordHash)) {
    return unauthorized("Credenciales invalidas.");
  }

  const rol = usuario.roles[0]?.rol.nombre as Rol | undefined;
  if (!rol) {
    return forbidden("El usuario no tiene un rol asignado.");
  }

  await createSession({
    sub: usuario.ci,
    email: usuario.email,
    role: rol,
    nombre: `${usuario.nombres} ${usuario.apellidos}`,
  });

  return ok({ user: { ci: usuario.ci, email: usuario.email, role: rol } });
}
