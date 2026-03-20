import path from "node:path";

import payload from "payload";

function loadLocalEnv() {
  const localEnvPath = path.resolve(process.cwd(), ".env.local");
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(localEnvPath);
  }
}

function parseArgs(args) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (!current.startsWith("--")) {
      positionals.push(current);
      continue;
    }

    const [rawKey, inlineValue] = current.slice(2).split("=", 2);
    if (!rawKey) {
      continue;
    }

    if (inlineValue !== undefined) {
      flags[rawKey] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      flags[rawKey] = next;
      index += 1;
      continue;
    }

    flags[rawKey] = true;
  }

  return { flags, positionals };
}

function getFlag(flags, ...names) {
  return names.some((name) => {
    if (!(name in flags)) {
      return false;
    }

    return flags[name] !== "false";
  });
}

function getOption(flags, ...names) {
  for (const name of names) {
    if (name in flags && typeof flags[name] === "string") {
      return flags[name];
    }
  }

  return undefined;
}

async function loadConfig() {
  const imported = await import("../src/payload.config.ts");
  return await imported.default;
}

async function main() {
  loadLocalEnv();
  process.env.PAYLOAD_MIGRATING = "true";

  const [command, ...rawArgs] = process.argv.slice(2);
  if (!command) {
    throw new Error("Missing migration command.");
  }

  const { flags, positionals } = parseArgs(rawArgs);
  const config = await loadConfig();

  await payload.init({
    config,
    disableDBConnect: command === "create",
    disableOnInit: true,
  });

  try {
    if (!payload.db) {
      throw new Error("No database adapter found.");
    }

    if (command === "create") {
      await payload.db.createMigration({
        file: getOption(flags, "file"),
        forceAcceptWarning: getFlag(flags, "force-accept-warning", "forceAcceptWarning"),
        migrationName: positionals[0],
        payload,
        skipEmpty: getFlag(flags, "skip-empty", "skipEmpty"),
      });
      return;
    }

    if (command === "migrate") {
      await payload.db.migrate();
      return;
    }

    if (command === "status") {
      await payload.db.migrateStatus();
      return;
    }

    throw new Error(`Unsupported migration command: ${command}`);
  } finally {
    await payload.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
