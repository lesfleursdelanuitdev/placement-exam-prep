// The app's database (NEXTJS-PLAN.md S3-5, S3-6): examprep on lfdln-appdb, as examprep_app, one
// pool. The password is a file (the container's podman secret), never an environment variable.
// The schema must be the one this release was built with: another answers "not ready", never
// half-right. Nothing here runs until the first request that needs it (guests never do).
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { SCHEMA } from './schema';

export type Sql = postgres.Sql;

let pool: Sql | null = null;
let checked: Promise<void> | null = null;

export class NotReady extends Error {}

function connect(): Sql {
  const env = process.env;
  const passwordFile = env.EXAMPREP_DB_PASSWORD_FILE ?? '/run/secrets/examprep-db';
  return postgres({
    host: env.EXAMPREP_DB_HOST ?? '10.0.2.2',
    port: Number(env.EXAMPREP_DB_PORT ?? 5436),
    database: env.EXAMPREP_DB_NAME ?? 'examprep',
    username: env.EXAMPREP_DB_USER ?? 'examprep_app',
    // read on every new connection, so a changed secret needs no restart
    password: () => readFileSync(/* turbopackIgnore: true */ passwordFile, 'utf8').trim(),
    max: Number(env.EXAMPREP_DB_POOL ?? 5),
    idle_timeout: 60,
    connect_timeout: 5,
    prepare: true,
    connection: { application_name: 'examprep' },
    onnotice: () => {},
  });
}

/** The migrations the database has, in order. */
export async function appliedMigrations(sql: Sql): Promise<string[]> {
  const rows = await sql<{ name: string }[]>`SELECT name FROM public.schema_migrations ORDER BY name`;
  return rows.map((r) => r.name);
}

async function checkSchema(sql: Sql) {
  const have = await appliedMigrations(sql);
  if (have.join(',') !== SCHEMA.join(',')) {
    throw new NotReady(`the database has migrations [${have.join(', ')}], this release expects [${SCHEMA.join(', ')}]`);
  }
}

/** The pool, once the schema is known to be this release's. */
export async function db(): Promise<Sql> {
  pool ??= connect();
  checked ??= checkSchema(pool).catch((e) => { checked = null; throw e; });
  await checked;
  return pool;
}

/** For tests: use this pool instead. */
export function useSql(sql: Sql | null) {
  pool = sql;
  checked = null;
}
