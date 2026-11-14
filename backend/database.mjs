import pg from 'pg';
import { readFile } from 'node:fs/promises';

export function database(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  // Keep TLS validation enabled. Local development alone may disable TLS.
  const url = new URL(env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  if (env.NODE_ENV === 'production' && env.DATABASE_SSL === 'false') {
    throw new Error('Production requires database TLS');
  }
  return new pg.Pool({ connectionString: url.toString(), max: 5,
    connectionTimeoutMillis: 5000,
    ssl: env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true } });
}

export async function migrate(db) {
  const sql = await readFile(new URL('../db/001-auth.sql', import.meta.url), 'utf8');
  // Single idempotent migration; schema changes run explicitly before deployment.
  await db.query(`BEGIN; ${sql} COMMIT;`);
}
