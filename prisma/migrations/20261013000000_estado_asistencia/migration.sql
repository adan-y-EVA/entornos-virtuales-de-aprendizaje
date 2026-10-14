-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'JUSTIFICADA');

-- AlterTable: add estado column (default AUSENTE)
ALTER TABLE "asistencia" ADD COLUMN "estado" "EstadoAsistencia" NOT NULL DEFAULT 'AUSENTE';

-- Backfill: migrate data from presente boolean
UPDATE "asistencia" SET "estado" = 'PRESENTE' WHERE "presente" = true;
UPDATE "asistencia" SET "estado" = 'AUSENTE' WHERE "presente" = false;

-- DropColumn
ALTER TABLE "asistencia" DROP COLUMN "presente";
