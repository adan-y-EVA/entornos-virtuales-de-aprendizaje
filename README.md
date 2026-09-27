This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Base de datos

Postgres 18 corriendo en Docker: base `entornos-db`, usuario `postgres`, password `example`, puerto `5433` (ver `compose.yaml` y `.env`).

### Puesta en marcha

```bash
pnpm install
pnpm db:up
```

`pnpm db:up` levanta el contenedor y no hay que correr migraciones ni seed a mano. Postgres ejecuta los scripts de `/docker-entrypoint-initdb.d` la unica vez que se crea el volumen, asi que en ese primer arranque quedan:

1. `prisma/migrations/20260927191554_init/migration.sql` montado como `01_schema.sql`: crea las 13 tablas.
2. `prisma/docker/02_seed.sql`: carga los datos de prueba.
3. `prisma/docker/03_prisma_migrations.sql`: registra la migracion en el historial de Prisma, para que `pnpm db:migrate` no detecte drift.

Si ya tenias el volumen creado antes de que existieran esos scripts, usa `pnpm db:fresh` para borrarlo y que se vuelvan a ejecutar.

### Comandos

| Comando | Que hace |
| --- | --- |
| `pnpm db:up` | Levanta el Postgres de `compose.yaml` |
| `pnpm db:down` | Apaga el contenedor, conservando el volumen |
| `pnpm db:fresh` | Borra el volumen y lo recrea: vuelve a ejecutar los scripts de arranque (se pierden los datos) |
| `pnpm db:migrate` | Crea y aplica una migracion segun los cambios en `schema.prisma` (pide confirmacion) |
| `pnpm db:generate` | Regenera el cliente de Prisma en `generated/prisma` |
| `pnpm db:seed` | Recarga los datos de prueba de `prisma/seed.ts`, borrando lo que haya |
| `pnpm db:studio` | Abre Prisma Studio para explorar la base |
| `pnpm db:reset` | Borra todas las tablas y reaplica las migraciones (destructivo) |
| `pnpm db:setup` | Atajo: `db:up` + `db:migrate` + `db:generate` + `db:seed` |
| `pnpm typecheck` | `tsc --noEmit` |

`postinstall` corre `prisma generate`, asi que el cliente siempre esta disponible despues de `pnpm install`.

### Regenerar los datos de prueba en SQL

`prisma/docker/02_seed.sql` es un `pg_dump` de la base ya sembrada. Despues de cambiar `prisma/seed.ts`:

```bash
pnpm db:seed
docker exec entornos-postgres pg_dump -U postgres -d entornos-db --data-only --schema=public --exclude-table=_prisma_migrations --column-inserts --no-owner --no-privileges
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
