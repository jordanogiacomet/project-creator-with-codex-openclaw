import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const SENTINEL_PREFIX = "__SPECWRIGHT_PAYLOAD_MIGRATIONS__:";

function emitSentinel(result, message) {
  if (message) {
    console.log(message);
  }
  console.log(`${SENTINEL_PREFIX}${result}`);
}

function loadLocalEnv() {
  const localEnvPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(localEnvPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(localEnvPath);
  }
}

function getMigrationDir() {
  return path.resolve(process.cwd(), "src/lib/migrations");
}

function getMigrationFiles() {
  const migrationDir = getMigrationDir();
  if (!fs.existsSync(migrationDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort();
}

function normalizeSpecifier(specifier) {
  const trimmed = specifier.trim();
  if (!trimmed) {
    return trimmed;
  }

  const withoutType = trimmed.replace(/^type\s+/, "");
  const baseName = withoutType.split(/\s+as\s+/)[0];
  if (baseName === "MigrateUpArgs" || baseName === "MigrateDownArgs") {
    return `type ${withoutType}`;
  }

  return trimmed;
}

function normalizeMigrationImports() {
  const migrationDir = getMigrationDir();

  for (const file of getMigrationFiles()) {
    const fullPath = path.join(migrationDir, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const nextContent = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]@payloadcms\/db-(mongodb|postgres)['"]/g,
      (_match, specifiers) => {
        const normalized = specifiers
          .split(",")
          .map((specifier) => normalizeSpecifier(specifier))
          .filter(Boolean);

        return `import { ${normalized.join(", ")} } from "@payloadcms/db-postgres"`;
      },
    );

    if (nextContent !== content) {
      fs.writeFileSync(fullPath, nextContent);
    }
  }
}

async function readMigrationState() {
  const connectionString = process.env.DATABASE_URI?.trim();
  if (!connectionString) {
    return null;
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    const existsResult = await client.query(
      "SELECT to_regclass('public.payload_migrations') AS table_name",
    );
    if (!existsResult.rows[0]?.table_name) {
      return { rows: [] };
    }

    const result = await client.query('SELECT name, batch FROM "payload_migrations"');
    return { rows: result.rows };
  } catch {
    return null;
  } finally {
    await client.end().catch(() => {});
  }
}

function getPendingMigrationNames(migrationFiles, rows) {
  const completed = new Set(rows.map((row) => String(row.name)));
  return migrationFiles
    .map((file) => file.replace(/\.ts$/, ""))
    .filter((name) => !completed.has(name));
}

function runMigrationCommand(commandArgs) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", path.resolve(process.cwd(), "scripts/payload-migrations-runner.mjs"), ...commandArgs],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function main() {
  loadLocalEnv();
  normalizeMigrationImports();

  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error("Usage: node ./scripts/payload-migrations.mjs <migrate|create|status>");
    process.exit(1);
  }

  if (command === "create") {
    const status = runMigrationCommand(["create", ...args]);
    if (status === 0) {
      normalizeMigrationImports();
    }
    process.exit(status);
  }

  if (command === "status") {
    process.exit(runMigrationCommand(["status", ...args]));
  }

  if (command !== "migrate") {
    console.error("Usage: node ./scripts/payload-migrations.mjs <migrate|create|status>");
    process.exit(1);
  }

  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length == 0) {
    emitSentinel("no-pending", "Specwright: no pending Payload migrations.");
    return;
  }

  const state = await readMigrationState();
  if (state) {
    const pending = getPendingMigrationNames(migrationFiles, state.rows);
    if (pending.length === 0) {
      emitSentinel("no-pending", "Specwright: no pending Payload migrations.");
      return;
    }

    if (state.rows.some((row) => Number(row.batch) === -1)) {
      emitSentinel(
        "dev-push",
        "Specwright: skipping Payload migrate because payload_migrations contains a dev-mode push marker (batch -1).",
      );
      return;
    }
  }

  process.exit(runMigrationCommand(["migrate", ...args]));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
