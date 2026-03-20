import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";

import { Authors } from "./collections/Authors.js";
import {
  getMediaStorageAdapter,
  getMediaUploadMaxFileSizeBytes,
  resolveMediaStorageDirectory,
  Media,
} from "./collections/Media.js";
import { Pages } from "./collections/Pages.js";
import { Posts } from "./collections/Posts.js";
import { Users } from "./collections/Users.js";
import { Homepage } from "./globals/Homepage.js";
import { SiteSettings } from "./globals/SiteSettings.js";
import { createPayloadDatabaseAdapter } from "./lib/db.js";
import { logInfo, payloadLogger } from "./lib/logger";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, "..");
const mediaUploadMaxFileSizeBytes = getMediaUploadMaxFileSizeBytes();
const mediaStorageDirectory = resolveMediaStorageDirectory(projectRoot);

export default (async () => {
  const { lexicalEditor } = await import("@payloadcms/richtext-lexical");

  return buildConfig({
    collections: [Users, Pages, Posts, Authors, Media],
    custom: {
      mediaStorage: {
        adapter: getMediaStorageAdapter(),
        directory: mediaStorageDirectory,
      },
    },
    db: createPayloadDatabaseAdapter(path.resolve(dirname, "lib/migrations")),
    editor: lexicalEditor({}),
    globals: [SiteSettings, Homepage],
    logger: payloadLogger,
    loggingLevels: {
      AuthenticationError: "warn",
      Forbidden: "warn",
      NotFound: "warn",
      ValidationError: "warn",
    },
    onInit: async () => {
      logInfo("Payload initialized", {
        source: "payload",
      });
    },
    routes: {
      admin: "/admin",
      api: "/api",
    },
    secret: process.env.PAYLOAD_SECRET || "PLEASE-CHANGE-ME",
    upload: {
      abortOnLimit: true,
      limits: {
        fileSize: mediaUploadMaxFileSizeBytes,
      },
    },
    typescript: {
      outputFile: path.resolve(dirname, "payload-types.ts"),
    },
  });
})();
