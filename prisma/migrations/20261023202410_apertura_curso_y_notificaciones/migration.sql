-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('ACTIVO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoApertura" AS ENUM ('PENDIENTE', 'ABIERTO', 'CERRADO');

-- curso.estado era VARCHAR ('activo') en las migraciones previas, aunque el
-- schema ya lo declaraba como enum. Se convierte en sitio para no perder datos.
ALTER TABLE "curso" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "curso" ALTER COLUMN "estado" TYPE "EstadoCurso"
  USING (CASE WHEN UPPER("estado") = 'CERRADO' THEN 'CERRADO' ELSE 'ACTIVO' END)::"EstadoCurso";
ALTER TABLE "curso" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "curso" ADD COLUMN     "codigo_materia" VARCHAR(20),
ADD COLUMN     "cupos_min" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estado_apertura" "EstadoApertura" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fecha_limite_inscripcion" DATE;

-- Backfill: los cursos que ya empezaron o ya terminaron se consideran abiertos.
-- Los futuros quedan PENDIENTE para que el instructor decida.
UPDATE "curso" SET "estado_apertura" = 'ABIERTO'
WHERE "fecha_ini" <= CURRENT_DATE OR "estado" = 'CERRADO';

-- Backfill: cada curso existente es su propia materia hasta que se agrupen.
UPDATE "curso" SET "codigo_materia" = "codigo" WHERE "codigo_materia" IS NULL;

-- CreateTable
CREATE TABLE "notificacion" (
    "id" SERIAL NOT NULL,
    "ci_usuario" VARCHAR(10) NOT NULL,
    "codigo_curso" VARCHAR(20),
    "titulo" VARCHAR(150) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacion_ci_usuario_leida_idx" ON "notificacion"("ci_usuario", "leida");

-- CreateIndex
CREATE INDEX "curso_codigo_materia_idx" ON "curso"("codigo_materia");

-- CreateIndex
CREATE INDEX "curso_estado_apertura_fecha_limite_inscripcion_idx" ON "curso"("estado_apertura", "fecha_limite_inscripcion");

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_ci_usuario_fkey" FOREIGN KEY ("ci_usuario") REFERENCES "usuario"("ci") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_codigo_curso_fkey" FOREIGN KEY ("codigo_curso") REFERENCES "curso"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;
