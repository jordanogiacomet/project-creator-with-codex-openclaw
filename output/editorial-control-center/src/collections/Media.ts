import path from "node:path";

import { ValidationError, type CollectionConfig } from "payload";

const DEFAULT_MEDIA_STORAGE_ADAPTER = "local-filesystem";
const DEFAULT_MEDIA_STORAGE_DIR = "media";
const DEFAULT_MEDIA_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const MEDIA_UPLOAD_KIND_MIME_TYPES = {
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  image: ["image/*"],
} as const;

export const MEDIA_UPLOAD_MIME_TYPES = Object.values(
  MEDIA_UPLOAD_KIND_MIME_TYPES,
).flat();

function readTrimmedEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function readPositiveIntegerEnv(name: string, defaultValue: number): number {
  const value = readTrimmedEnv(name);

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : defaultValue;
}

export function getMediaStorageAdapter(): string {
  const adapter =
    readTrimmedEnv("MEDIA_STORAGE_ADAPTER") || DEFAULT_MEDIA_STORAGE_ADAPTER;

  if (adapter !== DEFAULT_MEDIA_STORAGE_ADAPTER) {
    throw new Error(
      `MEDIA_STORAGE_ADAPTER must be '${DEFAULT_MEDIA_STORAGE_ADAPTER}' for local media uploads.`,
    );
  }

  return adapter;
}

export function getMediaStorageDirectoryName(): string {
  return readTrimmedEnv("MEDIA_STORAGE_DIR") || DEFAULT_MEDIA_STORAGE_DIR;
}

export function getMediaUploadMaxFileSizeBytes(): number {
  return readPositiveIntegerEnv(
    "MEDIA_MAX_FILE_SIZE_BYTES",
    DEFAULT_MEDIA_MAX_FILE_SIZE_BYTES,
  );
}

export function resolveMediaStorageDirectory(projectRoot = process.cwd()): string {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedStorageDirectory = path.resolve(
    resolvedProjectRoot,
    getMediaStorageDirectoryName(),
  );

  if (
    resolvedStorageDirectory !== resolvedProjectRoot &&
    !resolvedStorageDirectory.startsWith(`${resolvedProjectRoot}${path.sep}`)
  ) {
    throw new Error(
      "MEDIA_STORAGE_DIR must resolve to a directory inside the project root.",
    );
  }

  return resolvedStorageDirectory;
}

export function getMediaAdminThumbnail({
  doc,
}: {
  doc: Record<string, unknown>;
}): null | string {
  const mimeType = typeof doc.mimeType === "string" ? doc.mimeType : null;
  const url = typeof doc.url === "string" ? doc.url : null;

  if (!mimeType?.startsWith("image/") || !url) {
    return null;
  }

  return url;
}

export function validateMediaUploadFileSize(
  file: { size: number } | undefined,
  maxFileSizeBytes = getMediaUploadMaxFileSizeBytes(),
): void {
  if (!file || file.size <= maxFileSizeBytes) {
    return;
  }

  throw new ValidationError({
    errors: [
      {
        message: `File exceeds the upload limit of ${maxFileSizeBytes} bytes.`,
        path: "file",
      },
    ],
  });
}

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    defaultColumns: ["filename", "alt_text", "mime_type", "size", "updatedAt"],
    useAsTitle: "filename",
  },
  hooks: {
    beforeValidate: [
      ({ req }) => {
        validateMediaUploadFileSize(req.file);
      },
    ],
  },
  fields: [
    {
      name: "alt_text",
      type: "text",
    },
    {
      name: "caption",
      type: "textarea",
    },
    {
      name: "mime_type",
      type: "text",
      admin: {
        readOnly: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            typeof siblingData.mimeType === "string"
              ? siblingData.mimeType
              : undefined,
        ],
      },
      virtual: true,
    },
    {
      name: "size",
      type: "number",
      admin: {
        readOnly: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            typeof siblingData.filesize === "number"
              ? siblingData.filesize
              : undefined,
        ],
      },
      virtual: true,
    },
  ],
  upload: {
    adapter: getMediaStorageAdapter(),
    adminThumbnail: getMediaAdminThumbnail,
    disableLocalStorage: false,
    displayPreview: true,
    filesRequiredOnCreate: true,
    mimeTypes: MEDIA_UPLOAD_MIME_TYPES,
    staticDir: resolveMediaStorageDirectory(),
  },
};
