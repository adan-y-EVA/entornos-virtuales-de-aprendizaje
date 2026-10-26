-- AlterTable
ALTER TABLE "curso" ADD COLUMN     "nota_minima_aprobacion" DECIMAL(5,2) NOT NULL DEFAULT 70;

-- CreateTable
CREATE TABLE "evaluacion" (
    "id" SERIAL NOT NULL,
    "codigo_curso" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota" (
    "id" SERIAL NOT NULL,
    "id_evaluacion" INTEGER NOT NULL,
    "ci_estudiante" VARCHAR(10) NOT NULL,
    "valor" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluacion_codigo_curso_idx" ON "evaluacion"("codigo_curso");

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_codigo_curso_nombre_key" ON "evaluacion"("codigo_curso", "nombre");

-- CreateIndex
CREATE INDEX "nota_ci_estudiante_idx" ON "nota"("ci_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "nota_id_evaluacion_ci_estudiante_key" ON "nota"("id_evaluacion", "ci_estudiante");

-- AddForeignKey
ALTER TABLE "evaluacion" ADD CONSTRAINT "evaluacion_codigo_curso_fkey" FOREIGN KEY ("codigo_curso") REFERENCES "curso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_evaluacion_fkey" FOREIGN KEY ("id_evaluacion") REFERENCES "evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_ci_estudiante_fkey" FOREIGN KEY ("ci_estudiante") REFERENCES "estudiante"("ci") ON DELETE CASCADE ON UPDATE CASCADE;
