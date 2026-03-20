import { describe, expect, it } from "vitest";

import {
  applyPreviewHeaders,
  isPreviewCollection,
  parsePreviewLookup,
  PREVIEW_COLLECTIONS,
  resolvePreviewPath,
  sanitizePreviewExitPath,
} from "../lib/preview";

describe("preview helpers", () => {
  it("restricts preview to page and post collections", () => {
    expect(PREVIEW_COLLECTIONS).toEqual(["pages", "posts"]);
    expect(isPreviewCollection("pages")).toBe(true);
    expect(isPreviewCollection("posts")).toBe(true);
    expect(isPreviewCollection("authors")).toBe(false);
  });

  it("validates preview lookup parameters", () => {
    expect(
      parsePreviewLookup(
        new URLSearchParams({
          collection: "pages",
          slug: "about",
        }),
      ),
    ).toEqual({
      data: {
        collection: "pages",
        slug: "about",
      },
    });

    expect(
      parsePreviewLookup(
        new URLSearchParams({
          collection: "authors",
          slug: "staff",
        }),
      ),
    ).toEqual({
      error: "Preview collection must be pages or posts.",
    });

    expect(
      parsePreviewLookup(
        new URLSearchParams({
          collection: "posts",
        }),
      ),
    ).toEqual({
      error: "Preview slug is required.",
    });
  });

  it("maps preview lookups to public paths", () => {
    expect(
      resolvePreviewPath({
        collection: "pages",
        slug: "about",
      }),
    ).toBe("/pages/about");

    expect(
      resolvePreviewPath({
        collection: "posts",
        slug: "launch-day",
      }),
    ).toBe("/posts/launch-day");
  });

  it("rejects unsafe exit-preview redirect targets", () => {
    expect(sanitizePreviewExitPath("/posts/launch-day")).toBe("/posts/launch-day");
    expect(sanitizePreviewExitPath("posts/launch-day")).toBe("/");
    expect(sanitizePreviewExitPath("//evil.example")).toBe("/");
    expect(sanitizePreviewExitPath(null)).toBe("/");
  });

  it("marks preview responses as private and non-indexable", () => {
    const response = applyPreviewHeaders(new Response(null));

    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, no-cache, max-age=0, must-revalidate",
    );
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
});
