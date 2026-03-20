import { unstable_noStore as noStore } from "next/cache";
import { draftMode, headers } from "next/headers";
import type { PayloadRequest } from "payload";

import { createAuthRequest } from "./auth";
import { EDITORIAL_ROLES, hasAnyRole } from "./permissions";

export const PREVIEW_COLLECTIONS = ["pages", "posts"] as const;

export type PreviewCollection = (typeof PREVIEW_COLLECTIONS)[number];

export type PreviewLookup = {
  collection: PreviewCollection;
  slug: string;
};

export type PreviewResolution = PreviewLookup & {
  pathname: string;
};

export type PreviewState = {
  isEnabled: boolean;
  req?: PayloadRequest;
};

export function isPreviewCollection(value: unknown): value is PreviewCollection {
  return (
    typeof value === "string" &&
    PREVIEW_COLLECTIONS.includes(value as PreviewCollection)
  );
}

export function parsePreviewLookup(
  searchParams: URLSearchParams,
):
  | { data: PreviewLookup; error?: never }
  | { data?: never; error: string } {
  const collection = searchParams.get("collection");
  const slug = searchParams.get("slug")?.trim();

  if (!isPreviewCollection(collection)) {
    return {
      error: "Preview collection must be pages or posts.",
    };
  }

  if (!slug) {
    return {
      error: "Preview slug is required.",
    };
  }

  return {
    data: {
      collection,
      slug,
    },
  };
}

export function resolvePreviewPath({
  collection,
  slug,
}: PreviewLookup): string {
  return collection === "pages" ? `/pages/${slug}` : `/posts/${slug}`;
}

export function sanitizePreviewExitPath(pathname: null | string): string {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/";
  }

  return pathname;
}

export function applyPreviewHeaders<T extends Response>(response: T): T {
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

async function createServerAuthRequest(): Promise<PayloadRequest> {
  const requestHeaders = new Headers(await headers());
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return createAuthRequest(
    new Request(`${protocol}://${host}/`, {
      headers: requestHeaders,
      method: "GET",
    }),
  );
}

export async function getPreviewState(): Promise<PreviewState> {
  const preview = await draftMode();

  if (!preview.isEnabled) {
    return {
      isEnabled: false,
    };
  }

  const req = await createServerAuthRequest();
  const isEnabled = hasAnyRole(req.user, EDITORIAL_ROLES);

  if (!isEnabled) {
    return {
      isEnabled: false,
    };
  }

  noStore();

  return {
    isEnabled: true,
    req,
  };
}

export async function resolvePreviewContent({
  collection,
  req,
  slug,
}: PreviewLookup & {
  req: PayloadRequest;
}): Promise<null | PreviewResolution> {
  const { getPublicPageBySlug, getPublicPostBySlug } = await import(
    "./public-content"
  );

  if (collection === "pages") {
    const page = await getPublicPageBySlug({
      preview: true,
      req,
      slug,
    });

    if (!page) {
      return null;
    }

    return {
      collection,
      pathname: resolvePreviewPath({
        collection,
        slug: page.slug,
      }),
      slug: page.slug,
    };
  }

  const post = await getPublicPostBySlug({
    preview: true,
    req,
    slug,
  });

  if (!post) {
    return null;
  }

  return {
    collection,
    pathname: resolvePreviewPath({
      collection,
      slug: post.slug,
    }),
    slug: post.slug,
  };
}
