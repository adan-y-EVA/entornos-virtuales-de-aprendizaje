-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "usuario" (
    "ci" VARCHAR(10) NOT NULL,
    "nombres" VARCHAR(80) NOT NULL,
    "apellidos" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("ci")
);

-- CreateTable
CREATE TABLE "rol" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_rol" (
    "ci" VARCHAR(10) NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "usuario_rol_pkey" PRIMARY KEY ("ci","id_rol")
);

-- CreateTable
CREATE TABLE "estudiante" (
    "ci" VARCHAR(10) NOT NULL,
    "codigo_sis" VARCHAR(20) NOT NULL,
    "celular" VARCHAR(20) NOT NULL,

    CONSTRAINT "estudiante_pkey" PRIMARY KEY ("ci")
);

-- CreateTable
CREATE TABLE "instructor" (
    "ci" VARCHAR(10) NOT NULL,
    "especialidad" VARCHAR(120) NOT NULL,

    CONSTRAINT "instructor_pkey" PRIMARY KEY ("ci")
);

-- CreateTable
CREATE TABLE "curso" (
    "codigo" VARCHAR(20) NOT NULL,
    "ci_instructor" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "grupo" VARCHAR(10) NOT NULL,
    "nivel" VARCHAR(50) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'BOB',
    "fecha_ini" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "duracion_horas" INTEGER NOT NULL,
    "num_inscritos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "ambiente" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "capacidad" INTEGER NOT NULL,

    CONSTRAINT "ambiente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id" SERIAL NOT NULL,
    "codigo_curso" VARCHAR(20) NOT NULL,
    "id_ambiente" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripcion" (
    "id" SERIAL NOT NULL,
    "ci_estudiante" VARCHAR(10) NOT NULL,
    "codigo_curso" VARCHAR(20) NOT NULL,
    "tipo_precio" VARCHAR(30) NOT NULL,
    "fotocopia_ci" BOOLEAN NOT NULL DEFAULT false,
    "fecha_inscripcion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "monto_fisico" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monto_qr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_pago" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencia" (
    "id" SERIAL NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "ci_estudiante" VARCHAR(10) NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificado" (
    "id" SERIAL NOT NULL,
    "codigo_verificacion" VARCHAR(30) NOT NULL,
    "ci_estudiante" VARCHAR(10) NOT NULL,
    "codigo_curso" VARCHAR(20) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "nota_final" DECIMAL(5,2),
    "pct_asistencia" DECIMAL(5,2),

    CONSTRAINT "certificado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE INDEX "usuario_rol_id_rol_idx" ON "usuario_rol"("id_rol");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_codigo_sis_key" ON "estudiante"("codigo_sis");

-- CreateIndex
CREATE INDEX "curso_ci_instructor_idx" ON "curso"("ci_instructor");

-- CreateIndex
CREATE INDEX "curso_fecha_ini_idx" ON "curso"("fecha_ini");

-- CreateIndex
CREATE INDEX "sesion_codigo_curso_fecha_idx" ON "sesion"("codigo_curso", "fecha");

-- CreateIndex
CREATE INDEX "sesion_id_ambiente_idx" ON "sesion"("id_ambiente");

-- CreateIndex
CREATE INDEX "inscripcion_codigo_curso_idx" ON "inscripcion"("codigo_curso");

-- CreateIndex
CREATE INDEX "inscripcion_ci_estudiante_idx" ON "inscripcion"("ci_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_ci_estudiante_codigo_curso_key" ON "inscripcion"("ci_estudiante", "codigo_curso");

-- CreateIndex
CREATE UNIQUE INDEX "pago_id_inscripcion_key" ON "pago"("id_inscripcion");

-- CreateIndex
CREATE INDEX "asistencia_ci_estudiante_idx" ON "asistencia"("ci_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_id_sesion_ci_estudiante_key" ON "asistencia"("id_sesion", "ci_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_codigo_verificacion_key" ON "certificado"("codigo_verificacion");

-- CreateIndex
CREATE INDEX "certificado_codigo_curso_idx" ON "certificado"("codigo_curso");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_ci_estudiante_codigo_curso_key" ON "certificado"("ci_estudiante", "codigo_curso");

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_ci_fkey" FOREIGN KEY ("ci") REFERENCES "usuario"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiante" ADD CONSTRAINT "estudiante_ci_fkey" FOREIGN KEY ("ci") REFERENCES "usuario"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_ci_fkey" FOREIGN KEY ("ci") REFERENCES "usuario"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_ci_instructor_fkey" FOREIGN KEY ("ci_instructor") REFERENCES "instructor"("ci") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_codigo_curso_fkey" FOREIGN KEY ("codigo_curso") REFERENCES "curso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_id_ambiente_fkey" FOREIGN KEY ("id_ambiente") REFERENCES "ambiente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_ci_estudiante_fkey" FOREIGN KEY ("ci_estudiante") REFERENCES "estudiante"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_codigo_curso_fkey" FOREIGN KEY ("codigo_curso") REFERENCES "curso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "sesion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_ci_estudiante_fkey" FOREIGN KEY ("ci_estudiante") REFERENCES "estudiante"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificado" ADD CONSTRAINT "certificado_ci_estudiante_fkey" FOREIGN KEY ("ci_estudiante") REFERENCES "estudiante"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificado" ADD CONSTRAINT "certificado_codigo_curso_fkey" FOREIGN KEY ("codigo_curso") REFERENCES "curso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

