import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { randomBytes, scryptSync } from "node:crypto";

// GET: Obtener todos los instructores (Ya lo tenías)
export async function GET() {
  try {
    const instructoresBD = await prisma.instructor.findMany({
      include: {
        usuario: {
          select: { nombres: true, apellidos: true, email: true }
        }
      }
    });

    const instructores = instructoresBD.map(inst => ({
      ci: inst.ci,
      nombre: inst.usuario?.nombres || "Sin nombre",
      apellido: inst.usuario?.apellidos || "Sin apellido",
      email: inst.usuario?.email || "Sin correo",
      especialidad: inst.especialidad
    }));

    instructores.sort((a, b) => a.apellido.localeCompare(b.apellido));
    return NextResponse.json(instructores);
  } catch (error) {
    console.error("Error al cargar instructores:", error);
    return NextResponse.json({ error: "Error al cargar instructores" }, { status: 500 });
  }
}

// POST: Crear un nuevo instructor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ci, nombres, apellidos, email, especialidad } = body;

    // 1. Hashear la contraseña por defecto (usaremos el CI del instructor)
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(ci, salt, 64).toString("hex");
    const passwordHash = `scrypt$${salt}$${hash}`;

    // 2. Buscar el ID del rol INSTRUCTOR
    const rol = await prisma.rol.findUnique({ where: { nombre: 'INSTRUCTOR' } });
    if (!rol) throw new Error("Rol INSTRUCTOR no encontrado en la base de datos");

    // 3. Crear el Usuario, asignar Rol y crear Instructor (Todo en una transacción anidada de Prisma)
    await prisma.usuario.create({
      data: {
        ci,
        nombres,
        apellidos,
        email,
        passwordHash,
        roles: { create: { idRol: rol.id } },
        instructor: { create: { especialidad } }
      }
    });

    return NextResponse.json({ message: "Instructor registrado exitosamente" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al registrar instructor:", error);
    
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: "El CI o Correo ya están registrados" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}