import { postgresAdapter } from "@payloadcms/db-postgres";
import { Pool } from "pg";

const DATABASE_URI_ENV = "DATABASE_URI";
const DEFAULT_MAX_CONNECTIONS = 10;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to configure the postgres connection.`);
  }

  return value;
}

export function getDatabaseConnectionString(options = {}) {
  const { requireConnectionString = true } = options;

  if (!requireConnectionString) {
    return process.env[DATABASE_URI_ENV]?.trim() || "";
  }

  return getRequiredEnv(DATABASE_URI_ENV);
}

export function getDatabasePoolConfig(options = {}) {
  return {
    connectionString: getDatabaseConnectionString(options),
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    max: DEFAULT_MAX_CONNECTIONS,
  };
}

export function createPayloadDatabaseAdapter(migrationDir) {
  return postgresAdapter({
    migrationDir,
    pool: getDatabasePoolConfig({ requireConnectionString: false }),
  });
}

export function getDatabasePool() {
  if (!globalThis.__editorialControlCenterDbPool) {
    globalThis.__editorialControlCenterDbPool = new Pool(
      getDatabasePoolConfig(),
    );
  }

  return globalThis.__editorialControlCenterDbPool;
}

export async function verifyDatabaseConnection() {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      "select current_database() as current_database, now()::text as now",
    );

    return {
      connected: true,
      database: result.rows[0]?.current_database ?? "",
      now: result.rows[0]?.now ?? "",
    };
  } finally {
    client.release();
  }
}

export async function closeDatabasePool() {
  if (!globalThis.__editorialControlCenterDbPool) {
    return;
  }

  const pool = globalThis.__editorialControlCenterDbPool;
  globalThis.__editorialControlCenterDbPool = undefined;

  await pool.end();
}
