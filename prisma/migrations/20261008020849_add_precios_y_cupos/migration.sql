/*
  Warnings:

  - You are about to drop the column `costo` on the `curso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "curso" DROP COLUMN "costo",
ADD COLUMN     "costo_auxiliar" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "costo_externo" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "costo_umss" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "cupos_max" SET DEFAULT 0;
