-- Registra la migración inicial en el historial de Prisma.
--
-- El esquema y los datos los crea Postgres por su cuenta (01_schema.sql y
-- 02_seed.sql), asi que Prisma no llega a ejecutar la migracion y su tabla
-- _prisma_migrations quedaria vacia. Sin este registro, `prisma migrate dev`
-- detectaria drift en el primer cambio de esquema de cada compañero.
--
-- Si alguna vez se regenera 01_schema.sql hay que actualizar el checksum de
-- abajo con:  node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('prisma/migrations/20260927191554_init/migration.sql')).digest('hex'))"

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
VALUES (
    '00000000-0000-4000-8000-000000000001',
    '4569648d7691a399984fb392350a92a57bf18b53d17c70f36b272059147dd1c8',
    '20260927191554_init',
    now(),
    1
);
