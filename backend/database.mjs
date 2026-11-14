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
  const files = ['001-auth.sql', '002-username-accounts.sql', '003-consortia.sql'];
  const sql = await Promise.all(files.map(file => readFile(new URL(`../db/${file}`, import.meta.url), 'utf8')));
  // Explicit ordered, repeatable migrations, including upgrades of existing databases.
  await db.query(`BEGIN; ${sql.join('\n')} COMMIT;`);
}
