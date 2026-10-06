import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // Buscamos los instructores E INCLUIMOS sus datos de usuario
    const instructoresBD = await prisma.instructor.findMany({
      include: {
        usuario: {
          select: { nombres: true, apellidos: true }
        }
      }
    });

    // Mapeamos los datos para enviarle al frontend exactamente lo que espera
    const instructores = instructoresBD.map(inst => ({
      ci: inst.ci,
      nombre: inst.usuario?.nombres || "Sin nombre",
      apellido: inst.usuario?.apellidos || "Sin apellido",
      especialidad: inst.especialidad
    }));

    // Ordenamos alfabéticamente por apellido
    instructores.sort((a, b) => a.apellido.localeCompare(b.apellido));

    return NextResponse.json(instructores);
  } catch (error) {
    console.error("Error al cargar instructores:", error);
    return NextResponse.json({ error: "Error al cargar instructores" }, { status: 500 });
  }
}