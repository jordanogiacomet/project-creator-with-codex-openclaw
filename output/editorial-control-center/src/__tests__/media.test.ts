import { describe, expect, it } from "vitest";

import {
  getMediaAdminThumbnail,
  getMediaStorageAdapter,
  getMediaUploadMaxFileSizeBytes,
  Media,
  MEDIA_UPLOAD_KIND_MIME_TYPES,
  validateMediaUploadFileSize,
  resolveMediaStorageDirectory,
} from "../collections/Media";
import payloadConfig from "../payload.config";

describe("media library configuration", () => {
  it("supports the image and document media kinds required by the spec", () => {
    expect(MEDIA_UPLOAD_KIND_MIME_TYPES.image).toEqual(["image/*"]);
    expect(MEDIA_UPLOAD_KIND_MIME_TYPES.document).toEqual([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
  });

  it("uses the local filesystem media directory in the project root", () => {
    expect(getMediaStorageAdapter()).toBe("local-filesystem");
    expect(resolveMediaStorageDirectory("/workspace/output/editorial-control-center")).toBe(
      "/workspace/output/editorial-control-center/media",
    );

    expect(Media.upload).toMatchObject({
      adapter: "local-filesystem",
      disableLocalStorage: false,
      displayPreview: true,
      filesRequiredOnCreate: true,
    });

    if (Media.upload && typeof Media.upload === "object") {
      expect(Media.upload.staticDir).toBe(
        resolveMediaStorageDirectory(),
      );
    }
  });

  it("exposes thumbnails for image uploads only", () => {
    expect(
      getMediaAdminThumbnail({
        doc: {
          mimeType: "image/png",
          url: "/api/media/file/photo.png",
        },
      }),
    ).toBe("/api/media/file/photo.png");

    expect(
      getMediaAdminThumbnail({
        doc: {
          mimeType: "application/pdf",
          url: "/api/media/file/report.pdf",
        },
      }),
    ).toBeNull();
  });

  it("rejects files that exceed the configured upload size limit", () => {
    const maxFileSizeBytes = getMediaUploadMaxFileSizeBytes();

    try {
      validateMediaUploadFileSize(
        { size: maxFileSizeBytes + 1 },
        maxFileSizeBytes,
      );
      throw new Error("Expected the upload size validator to throw.");
    } catch (error) {
      expect(error).toMatchObject({
        data: {
          errors: [
            {
              message: `File exceeds the upload limit of ${maxFileSizeBytes} bytes.`,
              path: "file",
            },
          ],
        },
      });
    }

    expect(() =>
      validateMediaUploadFileSize({ size: maxFileSizeBytes }, maxFileSizeBytes),
    ).not.toThrow();
  });

  it("configures the global payload upload parser with the same file size limit", async () => {
    const config = await payloadConfig;

    expect(config.upload.abortOnLimit).toBe(true);
    expect(config.upload.limits).toMatchObject({
      fileSize: getMediaUploadMaxFileSizeBytes(),
    });
  });
});
