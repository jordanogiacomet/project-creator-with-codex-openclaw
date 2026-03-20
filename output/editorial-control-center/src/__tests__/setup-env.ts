import fs from "node:fs";
import path from "node:path";

const localEnvPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(localEnvPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(localEnvPath);
}
