import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const databaseDir = fileURLToPath(new URL('../.postgres', import.meta.url));
const database = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'local_practice_only',
  port: 54329,
  persistent: true,
  authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: (message) => { if (process.env.DEBUG_DB) console.log(message); },
  onError: (message) => console.error(String(message)),
});

try {
  if (!existsSync(`${databaseDir}/PG_VERSION`)) await database.initialise();
  await database.start();
  const client = database.getPgClient();
  await client.connect();
  try {
    for (const name of ['products', 'products_test']) {
      const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
    }
    console.log((await client.query('SELECT version()')).rows[0].version);
  } finally {
    await client.end();
  }
  console.log('PostgreSQL latihan siap di 127.0.0.1:54329. Data disimpan di .postgres/.');
  console.log('Gunakan terminal lain untuk migration dan API. Ctrl+C untuk berhenti.');
} catch (error) {
  console.error('PostgreSQL lokal gagal:', error?.message || String(error));
  process.exitCode = 1;
  await database.stop().catch(() => {});
}

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await database.stop();
  process.exit();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
