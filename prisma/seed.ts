import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en el archivo .env");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PASSWORD_SEMILLA = "123456";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function soloFecha(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function hora(iso: string): Date {
  return new Date(`1970-01-01T${iso}:00.000Z`);
}

const roles = [
  { nombre: "ADMIN" },
  { nombre: "INSTRUCTOR" },
  { nombre: "ESTUDIANTE" },
];

const ambientes = [
  { nombre: "Laboratorio de Informatica 1", capacidad: 30 },
  { nombre: "Laboratorio de Informatica 2", capacidad: 25 },
  { nombre: "Aula 204", capacidad: 40 },
  { nombre: "Aula 301", capacidad: 35 },
  { nombre: "Auditorio", capacidad: 80 },
];

const instructores = [
  {
    ci: "10000001",
    nombres: "Mario",
    apellidos: "Quispe Vargas",
    email: "mquispe@umss.edu.bo",
    especialidad: "Sistemas Distribuidos",
  },
  {
    ci: "10000002",
    nombres: "Lucia",
    apellidos: "Mendoza Paz",
    email: "lmendoza@umss.edu.bo",
    especialidad: "Base de Datos",
  },
  {
    ci: "10000003",
    nombres: "Jorge",
    apellidos: "Antezana Rojas",
    email: "jantezana@umss.edu.bo",
    especialidad: "Redes y Comunicacion",
  },
];

const estudiantes = [
  { ci: "20000001", nombres: "Ana", apellidos: "Flores Nina", email: "aflores@student.umss.edu.bo", codigoSis: "2021001", celular: "70111222" },
  { ci: "20000002", nombres: "Bruno", apellidos: "Cori Mamani", email: "bcori@student.umss.edu.bo", codigoSis: "2021002", celular: "70222333" },
  { ci: "20000003", nombres: "Carla", apellidos: "Rojas Sandoval", email: "crojas@student.umss.edu.bo", codigoSis: "2021003", celular: "70333444" },
  { ci: "20000004", nombres: "Diego", apellidos: "Alvarez Siles", email: "dalvarez@student.umss.edu.bo", codigoSis: "2022001", celular: "70444555" },
  { ci: "20000005", nombres: "Elena", apellidos: "Justiniano Ayub", email: "ejustiniano@student.umss.edu.bo", codigoSis: "2022002", celular: "70555666" },
  { ci: "20000006", nombres: "Fabricio", apellidos: "Torres Balderrama", email: "ftorres@student.umss.edu.bo", codigoSis: "2022003", celular: "70666777" },
  { ci: "20000007", nombres: "Gabriela", apellidos: "Ortiz Cuellar", email: "gortiz@student.umss.edu.bo", codigoSis: "2023001", celular: "70777888" },
  { ci: "20000008", nombres: "Hugo", apellidos: "Salazar Terrazas", email: "hsalazar@student.umss.edu.bo", codigoSis: "2023002", celular: "70888999" },
];

const administrador = {
  ci: "30000001",
  nombres: "Rosa",
  apellidos: "Mamani Villarroel",
  email: "rmamani@umss.edu.bo",
};

const cursos = [
  {
    codigo: "INF-101",
    ciInstructor: "10000001",
    nombre: "Fundamentos de Programacion",
    grupo: "A",
    nivel: "Básico", // Ajustado para que coincida con las opciones del dropdown
    costoExterno: "120.00",
    costoUmss: "100.00",
    costoAuxiliar: "50.00",
    fechaIni: "2026-02-02",
    fechaFin: "2026-06-26",
    duracionHoras: 40,
    cuposMax: 25,
  },
  {
    codigo: "INF-204",
    ciInstructor: "10000002",
    nombre: "Base de Datos Relacionales",
    grupo: "B",
    nivel: "Medio",
    costoExterno: "100.00",
    costoUmss: "80.00",
    costoAuxiliar: "40.00",
    fechaIni: "2026-02-09",
    fechaFin: "2026-06-26",
    duracionHoras: 48,
    cuposMax: 20,
  },
  {
    codigo: "INF-301",
    ciInstructor: "10000003",
    nombre: "Redes de Computadores",
    grupo: "A",
    nivel: "Avanzado",
    costoExterno: "110.00",
    costoUmss: "90.00",
    costoAuxiliar: "45.00",
    fechaIni: "2026-03-02",
    fechaFin: "2026-07-17",
    duracionHoras: 40,
    cuposMax: 30,
  },
  {
    codigo: "INF-150",
    ciInstructor: "10000001",
    nombre: "Introduccion a la Informatica",
    grupo: "C",
    nivel: "Básico",
    costoExterno: "180.00",
    costoUmss: "150.00",
    costoAuxiliar: "75.00",
    fechaIni: "2025-08-04",
    fechaFin: "2025-12-12",
    duracionHoras: 32,
    cuposMax: 0,
  },
];

const sesionesPorCurso: Record<string, { ambiente: number; fecha: string; inicio: string; fin: string }[]> = {
  "INF-101": [
    { ambiente: 0, fecha: "2026-02-02", inicio: "08:00", fin: "10:00" },
    { ambiente: 0, fecha: "2026-02-09", inicio: "08:00", fin: "10:00" },
    { ambiente: 2, fecha: "2026-02-16", inicio: "10:00", fin: "12:00" },
  ],
  "INF-204": [
    { ambiente: 1, fecha: "2026-02-09", inicio: "14:00", fin: "16:00" },
    { ambiente: 1, fecha: "2026-02-16", inicio: "14:00", fin: "16:00" },
  ],
  "INF-301": [
    { ambiente: 3, fecha: "2026-03-02", inicio: "16:00", fin: "18:00" },
    { ambiente: 4, fecha: "2026-03-09", inicio: "16:00", fin: "18:00" },
  ],
  "INF-150": [
    { ambiente: 2, fecha: "2025-08-04", inicio: "08:00", fin: "10:00" },
    { ambiente: 2, fecha: "2025-08-11", inicio: "08:00", fin: "10:00" },
  ],
};

const inscripciones: { estudiante: number; curso: number; tipoPrecio: string; fotocopiaCi: boolean; fecha: string }[] = [
  { estudiante: 0, curso: 0, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-01-20" },
  { estudiante: 1, curso: 0, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-01-21" },
  { estudiante: 2, curso: 0, tipoPrecio: "BENEFICIARIO", fotocopiaCi: false, fecha: "2026-01-22" },
  { estudiante: 3, curso: 1, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-01-25" },
  { estudiante: 4, curso: 1, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-01-26" },
  { estudiante: 5, curso: 1, tipoPrecio: "BENEFICIARIO", fotocopiaCi: false, fecha: "2026-01-27" },
  { estudiante: 0, curso: 1, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-01-28" },
  { estudiante: 6, curso: 2, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-02-10" },
  { estudiante: 7, curso: 2, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2026-02-11" },
  { estudiante: 1, curso: 2, tipoPrecio: "BENEFICIARIO", fotocopiaCi: false, fecha: "2026-02-12" },
  { estudiante: 0, curso: 3, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2025-07-28" },
  { estudiante: 2, curso: 3, tipoPrecio: "ORIGINAL", fotocopiaCi: true, fecha: "2025-07-29" },
  { estudiante: 4, curso: 3, tipoPrecio: "BENEFICIARIO", fotocopiaCi: false, fecha: "2025-07-30" },
];

const pagosPorInscripcion: { montoFisico: string; montoQr: string; fecha: string }[] = [
  { montoFisico: "800.00", montoQr: "0.00", fecha: "2026-01-20" },
  { montoFisico: "400.00", montoQr: "400.00", fecha: "2026-01-21" },
  { montoFisico: "0.00", montoQr: "600.00", fecha: "2026-01-22" },
  { montoFisico: "1200.00", montoQr: "0.00", fecha: "2026-01-25" },
  { montoFisico: "600.00", montoQr: "600.00", fecha: "2026-01-26" },
  { montoFisico: "0.00", montoQr: "900.00", fecha: "2026-01-27" },
  { montoFisico: "1200.00", montoQr: "0.00", fecha: "2026-01-28" },
  { montoFisico: "950.00", montoQr: "0.00", fecha: "2026-02-10" },
  { montoFisico: "950.00", montoQr: "0.00", fecha: "2026-02-11" },
  { montoFisico: "0.00", montoQr: "700.00", fecha: "2026-02-12" },
  { montoFisico: "450.00", montoQr: "0.00", fecha: "2025-07-28" },
  { montoFisico: "450.00", montoQr: "0.00", fecha: "2025-07-29" },
];

const indexesAsistencia = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12];

const certificados = [
  {
    codigoVerificacion: "CERT-2025-0001",
    estudiante: 0,
    curso: 3,
    fechaEmision: "2025-12-19",
    tipo: "APROVADO",
    notaFinal: "78.00",
    pctAsistencia: "100.00",
  },
  {
    codigoVerificacion: "CERT-2025-0002",
    estudiante: 2,
    curso: 3,
    fechaEmision: "2025-12-19",
    tipo: "APROVADO",
    notaFinal: "64.50",
    pctAsistencia: "80.00",
  },
  {
    codigoVerificacion: "CERT-2025-0003",
    estudiante: 4,
    curso: 3,
    fechaEmision: "2025-12-19",
    tipo: "ASISTENCIA",
    notaFinal: null,
    pctAsistencia: "75.00",
  },
];

async function limpiar() {
  await prisma.certificado.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.inscripcion.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.curso.updateMany({ data: { numInscritos: 0 } });
  await prisma.curso.deleteMany();
  await prisma.ambiente.deleteMany();
  await prisma.usuarioRol.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();
}

async function main() {
  await limpiar();

  const passwordHash = hashPassword(PASSWORD_SEMILLA);

  const rolesCreados = await Promise.all(
    roles.map((rol) => prisma.rol.create({ data: rol })),
  );
  const rolPorNombre = new Map(rolesCreados.map((rol) => [rol.nombre, rol.id]));

  await prisma.usuario.create({
    data: {
      ci: administrador.ci,
      nombres: administrador.nombres,
      apellidos: administrador.apellidos,
      email: administrador.email,
      passwordHash,
      roles: { create: { idRol: rolPorNombre.get("ADMIN")! } },
    },
  });

  for (const instructor of instructores) {
    await prisma.usuario.create({
      data: {
        ci: instructor.ci,
        nombres: instructor.nombres,
        apellidos: instructor.apellidos,
        email: instructor.email,
        passwordHash,
        roles: { create: { idRol: rolPorNombre.get("INSTRUCTOR")! } },
        instructor: {
          create: { especialidad: instructor.especialidad },
        },
      },
    });
  }

  for (const estudiante of estudiantes) {
    await prisma.usuario.create({
      data: {
        ci: estudiante.ci,
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        email: estudiante.email,
        passwordHash,
        roles: { create: { idRol: rolPorNombre.get("ESTUDIANTE")! } },
        estudiante: {
          create: {
            codigoSis: estudiante.codigoSis,
            celular: estudiante.celular,
          },
        },
      },
    });
  }

  const ambientesCreados = await Promise.all(
    ambientes.map((ambiente) => prisma.ambiente.create({ data: ambiente })),
  );

  for (const curso of cursos) {
    await prisma.curso.create({
      data: {
        codigo: curso.codigo,
        ciInstructor: curso.ciInstructor,
        nombre: curso.nombre,
        grupo: curso.grupo,
        nivel: curso.nivel,
        // Reemplazamos 'costo' por los 3 nuevos campos
        costoExterno: curso.costoExterno,
        costoUmss: curso.costoUmss,
        costoAuxiliar: curso.costoAuxiliar,
        fechaIni: soloFecha(curso.fechaIni),
        fechaFin: soloFecha(curso.fechaFin),
        duracionHoras: curso.duracionHoras,
        estado: "activo", // Agregamos el estado por defecto
        cuposMax: curso.cuposMax,
      },
    });

    for (const sesion of sesionesPorCurso[curso.codigo]) {
      await prisma.sesion.create({
        data: {
          codigoCurso: curso.codigo,
          idAmbiente: ambientesCreados[sesion.ambiente].id,
          fecha: soloFecha(sesion.fecha),
          horaInicio: hora(sesion.inicio),
          horaFin: hora(sesion.fin),
        },
      });
    }
  }

  let indicePago = 0;
  for (const inscripcion of inscripciones) {
    const creada = await prisma.inscripcion.create({
      data: {
        ciEstudiante: estudiantes[inscripcion.estudiante].ci,
        codigoCurso: cursos[inscripcion.curso].codigo,
        tipoPrecio: inscripcion.tipoPrecio,
        fotocopiaCi: inscripcion.fotocopiaCi,
        fechaInscripcion: soloFecha(inscripcion.fecha),
      },
    });

    const pago = pagosPorInscripcion[indicePago];
    if (pago) {
      await prisma.pago.create({
        data: {
          idInscripcion: creada.id,
          montoFisico: pago.montoFisico,
          montoQr: pago.montoQr,
          fechaPago: soloFecha(pago.fecha),
        },
      });
    }
    indicePago += 1;
  }

  for (const codigoCurso of Object.keys(sesionesPorCurso)) {
    const total = await prisma.inscripcion.count({ where: { codigoCurso } });
    await prisma.curso.update({
      where: { codigo: codigoCurso },
      data: { numInscritos: total },
    });
  }

  for (const indice of indexesAsistencia) {
    const inscripcion = inscripciones[indice];
    const sesiones = await prisma.sesion.findMany({
      where: { codigoCurso: cursos[inscripcion.curso].codigo },
      orderBy: { fecha: "asc" },
    });
    for (const sesion of sesiones) {
      const presente = indice % 4 !== 3;
      await prisma.asistencia.create({
        data: {
          idSesion: sesion.id,
          ciEstudiante: estudiantes[inscripcion.estudiante].ci,
          presente,
        },
      });
    }
  }

  for (const certificado of certificados) {
    await prisma.certificado.create({
      data: {
        codigoVerificacion: certificado.codigoVerificacion,
        ciEstudiante: estudiantes[certificado.estudiante].ci,
        codigoCurso: cursos[certificado.curso].codigo,
        fechaEmision: soloFecha(certificado.fechaEmision),
        tipo: certificado.tipo,
        notaFinal: certificado.notaFinal,
        pctAsistencia: certificado.pctAsistencia,
      },
    });
  }

  const resumen = {
    roles: await prisma.rol.count(),
    usuarios: await prisma.usuario.count(),
    estudiantes: await prisma.estudiante.count(),
    instructores: await prisma.instructor.count(),
    ambientes: await prisma.ambiente.count(),
    cursos: await prisma.curso.count(),
    sesiones: await prisma.sesion.count(),
    inscripciones: await prisma.inscripcion.count(),
    pagos: await prisma.pago.count(),
    asistencias: await prisma.asistencia.count(),
    certificados: await prisma.certificado.count(),
  };

  console.table(resumen);
  console.log(`Seed completada. Password de todos los usuarios: ${PASSWORD_SEMILLA}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
