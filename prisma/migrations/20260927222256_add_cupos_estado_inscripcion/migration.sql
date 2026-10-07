-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('INSCRITO', 'CANCELADO');

-- AlterTable
-- cupos_max es obligatorio y 0 significa "sin limite de cupos", por eso se agrega
-- con un default temporal para poder poblar los cursos existentes y luego se retira.
ALTER TABLE "curso" ADD COLUMN     "cupos_max" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "curso" ALTER COLUMN "cupos_max" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inscripcion" ADD COLUMN     "estado" "EstadoInscripcion" NOT NULL DEFAULT 'INSCRITO';

-- CreateIndex
CREATE INDEX "inscripcion_codigo_curso_estado_idx" ON "inscripcion"("codigo_curso", "estado");
