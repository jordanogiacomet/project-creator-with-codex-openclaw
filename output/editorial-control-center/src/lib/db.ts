import { postgresAdapter } from "@payloadcms/db-postgres";
import { Pool, type PoolConfig } from "pg";

import { logDebug, logError } from "./logger";

const DATABASE_URI_ENV = "DATABASE_URI";
const DEFAULT_MAX_CONNECTIONS = 10;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;

type DatabaseConnectionOptions = {
  requireConnectionString?: boolean;
};

declare global {
  var __editorialControlCenterDbPool: Pool | undefined;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to configure the postgres connection.`);
  }

  return value;
}

export function getDatabaseConnectionString(
  options: DatabaseConnectionOptions = {},
): string {
  const { requireConnectionString = true } = options;

  if (!requireConnectionString) {
    return process.env[DATABASE_URI_ENV]?.trim() || "";
  }

  return getRequiredEnv(DATABASE_URI_ENV);
}

export function getDatabasePoolConfig(
  options: DatabaseConnectionOptions = {},
): PoolConfig {
  return {
    connectionString: getDatabaseConnectionString(options),
    max: DEFAULT_MAX_CONNECTIONS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
  };
}

export function createPayloadDatabaseAdapter(migrationDir: string) {
  return postgresAdapter({
    migrationDir,
    pool: getDatabasePoolConfig({ requireConnectionString: false }),
  });
}

export function getDatabasePool(): Pool {
  if (!globalThis.__editorialControlCenterDbPool) {
    const pool = new Pool(getDatabasePoolConfig());

    pool.on("error", (error) => {
      logError("Unexpected database pool error", error, {
        source: "database",
      });
    });

    globalThis.__editorialControlCenterDbPool = pool;

    logDebug("Initialized postgres connection pool", {
      source: "database",
    });
  }

  return globalThis.__editorialControlCenterDbPool;
}

export async function verifyDatabaseConnection(): Promise<{
  connected: true;
  database: string;
  now: string;
}> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    const result = await client.query<{ current_database: string; now: string }>(
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

export async function closeDatabasePool(): Promise<void> {
  if (!globalThis.__editorialControlCenterDbPool) {
    return;
  }

  const pool = globalThis.__editorialControlCenterDbPool;
  globalThis.__editorialControlCenterDbPool = undefined;

  await pool.end();

  logDebug("Closed postgres connection pool", {
    source: "database",
  });
}
