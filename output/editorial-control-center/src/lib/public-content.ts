import type { SerializedEditorState } from "lexical";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { PayloadRequest, Where } from "payload";
import { getPayload } from "payload";

import config from "@payload-config";

import { getPublicContentWhere } from "./content-status";

export const PUBLIC_REVALIDATE_SECONDS = 60;
const DEFAULT_SITE_NAME = "Editorial Control Center";
const DEFAULT_HOME_TITLE = "Editorial Control Center";
const DEFAULT_HOME_DESCRIPTION = "Latest editorial updates and published site content.";
const HOMEPAGE_FEATURED_LIMIT = 3;
const LATEST_CONTENT_LIMIT = 5;

type ID = number | string;

type LexicalContent = null | SerializedEditorState;
type RelationValue = ID | Record<string, unknown> | null | undefined;

export type PublicMedia = {
  altText: null | string;
  caption: null | string;
  filename: null | string;
  height: null | number;
  id: ID;
  mimeType: null | string;
  url: null | string;
  width: null | number;
};

export type PublicAuthor = {
  avatar: null | PublicMedia;
  bio: null | string;
  id: ID;
  name: string;
  slug: null | string;
};

export type PublicPage = {
  body: LexicalContent;
  hero: null | PublicMedia;
  id: ID;
  publishedAt: null | string;
  seoDescription: null | string;
  seoTitle: null | string;
  slug: string;
  title: string;
};

export type PublicPost = {
  author: null | PublicAuthor;
  body: LexicalContent;
  excerpt: null | string;
  featuredImage: null | PublicMedia;
  id: ID;
  publishedAt: null | string;
  slug: string;
  title: string;
};

export type PublicNavigationItem = {
  href: string;
  label: string;
};

export type PublicSiteSettings = {
  defaultSeoDescription: null | string;
  defaultSeoTitle: null | string;
  footer: LexicalContent;
  navigation: PublicNavigationItem[];
  siteName: string;
};

export type PublicHomepage = {
  featuredPages: PublicPage[];
  featuredPosts: PublicPost[];
  hero: {
    description: null | string;
    media: null | PublicMedia;
    title: null | string;
  };
  latestPages: PublicPage[];
  latestPosts: PublicPost[];
  seoDescription: null | string;
  seoTitle: null | string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readString(value: unknown): null | string {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function readNumber(value: unknown): null | number {
  return typeof value === "number" ? value : null;
}

function readRichText(value: unknown): LexicalContent {
  return isRecord(value) ? (value as unknown as SerializedEditorState) : null;
}

function readID(value: unknown): ID | null {
  return typeof value === "number" || typeof value === "string" ? value : null;
}

function readRelationID(value: RelationValue): ID | null {
  if (readID(value) !== null) {
    return value as ID;
  }

  return isRecord(value) ? readID(value.id) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readGroup(
  parent: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = parent[key];

  return isRecord(value) ? value : {};
}

function combineWhere(...clauses: Array<undefined | Where>): undefined | Where {
  const filteredClauses = clauses.filter((clause): clause is Where => Boolean(clause));

  if (filteredClauses.length === 0) {
    return undefined;
  }

  if (filteredClauses.length === 1) {
    return filteredClauses[0];
  }

  return {
    and: filteredClauses,
  };
}

function createMetadataBase() {
  const port = process.env.PORT?.trim() || "3000";

  return new URL(`http://localhost:${port}`);
}

function normalizeImageURL(url: null | string): null | string {
  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, createMetadataBase()).toString();
}

function toPublicMedia(value: RelationValue): null | PublicMedia {
  if (!isRecord(value)) {
    return null;
  }

  const id = readID(value.id);

  if (id === null) {
    return null;
  }

  return {
    altText: readString(value.alt_text),
    caption: readString(value.caption),
    filename: readString(value.filename),
    height: readNumber(value.height),
    id,
    mimeType: readString(value.mimeType) ?? readString(value.mime_type),
    url: readString(value.url),
    width: readNumber(value.width),
  };
}

function toPublicAuthor(value: RelationValue): null | PublicAuthor {
  if (!isRecord(value)) {
    return null;
  }

  const id = readID(value.id);
  const name = readString(value.name);

  if (id === null || name === null) {
    return null;
  }

  return {
    avatar: toPublicMedia(value.avatar as RelationValue),
    bio: readString(value.bio),
    id,
    name,
    slug: readString(value.slug),
  };
}

function toPublicPage(value: unknown): null | PublicPage {
  if (!isRecord(value)) {
    return null;
  }

  const id = readID(value.id);
  const slug = readString(value.slug);
  const title = readString(value.title);

  if (id === null || slug === null || title === null) {
    return null;
  }

  return {
    body: readRichText(value.body_or_blocks),
    hero: toPublicMedia(value.hero as RelationValue),
    id,
    publishedAt: readString(value.published_at),
    seoDescription: readString(value.seo_description),
    seoTitle: readString(value.seo_title),
    slug,
    title,
  };
}

function toPublicPost(value: unknown): null | PublicPost {
  if (!isRecord(value)) {
    return null;
  }

  const id = readID(value.id);
  const slug = readString(value.slug);
  const title = readString(value.title);

  if (id === null || slug === null || title === null) {
    return null;
  }

  return {
    author: toPublicAuthor(value.author as RelationValue),
    body: readRichText(value.body),
    excerpt: readString(value.excerpt),
    featuredImage: toPublicMedia(value.featured_image as RelationValue),
    id,
    publishedAt: readString(value.published_at),
    slug,
    title,
  };
}

function sortByOriginalOrder<T extends { id: ID }>(docs: T[], ids: ID[]): T[] {
  const order = new Map(ids.map((id, index) => [String(id), index]));

  return [...docs].sort(
    (left, right) =>
      (order.get(String(left.id)) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(String(right.id)) ?? Number.MAX_SAFE_INTEGER),
  );
}

const getPayloadClient = cache(async () => getPayload({ config }));

async function queryPageBySlug({
  preview = false,
  req,
  slug,
}: {
  preview?: boolean;
  req?: PayloadRequest;
  slug: string;
}): Promise<null | PublicPage> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    depth: 1,
    limit: 1,
    pagination: false,
    req,
    where: combineWhere(getPublicContentWhere({ preview }), {
      slug: {
        equals: slug,
      },
    }),
  });

  return toPublicPage(result.docs[0]);
}

async function queryPostBySlug({
  preview = false,
  req,
  slug,
}: {
  preview?: boolean;
  req?: PayloadRequest;
  slug: string;
}): Promise<null | PublicPost> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 1,
    pagination: false,
    req,
    where: combineWhere(getPublicContentWhere({ preview }), {
      slug: {
        equals: slug,
      },
    }),
  });

  return toPublicPost(result.docs[0]);
}

async function queryLatestPages(limit = LATEST_CONTENT_LIMIT): Promise<PublicPage[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    depth: 1,
    limit,
    pagination: false,
    sort: "-published_at",
    where: getPublicContentWhere(),
  });

  return result.docs.map(toPublicPage).filter((doc): doc is PublicPage => doc !== null);
}

async function queryLatestPosts(limit = LATEST_CONTENT_LIMIT): Promise<PublicPost[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    depth: 1,
    limit,
    pagination: false,
    sort: "-published_at",
    where: getPublicContentWhere(),
  });

  return result.docs.map(toPublicPost).filter((doc): doc is PublicPost => doc !== null);
}

async function queryPagesByIDs(ids: ID[]): Promise<PublicPage[]> {
  if (ids.length === 0) {
    return [];
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    depth: 1,
    limit: ids.length,
    pagination: false,
    where: combineWhere(getPublicContentWhere(), {
      id: {
        in: ids,
      },
    }),
  });

  return sortByOriginalOrder(
    result.docs.map(toPublicPage).filter((doc): doc is PublicPage => doc !== null),
    ids,
  );
}

async function queryPostsByIDs(ids: ID[]): Promise<PublicPost[]> {
  if (ids.length === 0) {
    return [];
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    depth: 1,
    limit: ids.length,
    pagination: false,
    where: combineWhere(getPublicContentWhere(), {
      id: {
        in: ids,
      },
    }),
  });

  return sortByOriginalOrder(
    result.docs.map(toPublicPost).filter((doc): doc is PublicPost => doc !== null),
    ids,
  );
}

async function querySiteSettings(): Promise<PublicSiteSettings> {
  const payload = await getPayloadClient();
  const docResult = await payload.findGlobal({
    depth: 1,
    slug: "site-settings",
  });
  const doc = isRecord(docResult) ? docResult : {};
  const defaultSEO = readGroup(doc, "default_seo");

  return {
    defaultSeoDescription:
      readString(defaultSEO.description) ?? readString(doc.default_seo_description),
    defaultSeoTitle: readString(defaultSEO.title) ?? readString(doc.default_seo_title),
    footer: readRichText(doc.footer),
    navigation: asArray(doc.navigation)
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const href = readString(item.href);
        const label = readString(item.label);

        if (!href || !label) {
          return null;
        }

        return { href, label };
      })
      .filter((item): item is PublicNavigationItem => item !== null),
    siteName: readString(doc.site_name) ?? DEFAULT_SITE_NAME,
  };
}

async function queryHomepage(): Promise<PublicHomepage> {
  const payload = await getPayloadClient();
  const docResult = await payload.findGlobal({
    depth: 1,
    slug: "homepage",
  });
  const doc = isRecord(docResult) ? docResult : {};
  const hero = readGroup(doc, "hero");
  const seo = readGroup(doc, "seo");
  const featuredPostIDs = asArray(doc.featured_posts)
    .map((value) => readRelationID(value as RelationValue))
    .filter((value): value is ID => value !== null);
  const featuredPageIDs = asArray(doc.featured_pages)
    .map((value) => readRelationID(value as RelationValue))
    .filter((value): value is ID => value !== null);
  const featuredPosts = await queryPostsByIDs(featuredPostIDs);
  const featuredPages = await queryPagesByIDs(featuredPageIDs);

  return {
    featuredPages,
    featuredPosts,
    hero: {
      description: readString(hero.description) ?? readString(doc.hero_description),
      media:
        toPublicMedia(hero.media as RelationValue) ??
        toPublicMedia(doc.hero_media as RelationValue),
      title: readString(hero.title) ?? readString(doc.hero_title),
    },
    latestPages:
      featuredPages.length > 0
        ? featuredPages.slice(0, HOMEPAGE_FEATURED_LIMIT)
        : await queryLatestPages(HOMEPAGE_FEATURED_LIMIT),
    latestPosts:
      featuredPosts.length > 0
        ? featuredPosts.slice(0, HOMEPAGE_FEATURED_LIMIT)
        : await queryLatestPosts(HOMEPAGE_FEATURED_LIMIT),
    seoDescription: readString(seo.description) ?? readString(doc.seo_description),
    seoTitle: readString(seo.title) ?? readString(doc.seo_title),
  };
}

const getCachedPageBySlug = unstable_cache(
  async (slug: string) => queryPageBySlug({ slug }),
  ["public-page-by-slug"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  },
);

const getCachedPostBySlug = unstable_cache(
  async (slug: string) => queryPostBySlug({ slug }),
  ["public-post-by-slug"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  },
);

const getCachedLatestPages = unstable_cache(queryLatestPages, ["public-latest-pages"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
});

const getCachedLatestPosts = unstable_cache(queryLatestPosts, ["public-latest-posts"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
});

const getCachedSiteSettings = unstable_cache(querySiteSettings, ["public-site-settings"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
});

const getCachedHomepage = unstable_cache(queryHomepage, ["public-homepage"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
});

export async function getPublicPageBySlug({
  preview = false,
  req,
  slug,
}: {
  preview?: boolean;
  req?: PayloadRequest;
  slug: string;
}): Promise<null | PublicPage> {
  if (preview) {
    return queryPageBySlug({ preview: true, req, slug });
  }

  return getCachedPageBySlug(slug);
}

export async function getPublicPostBySlug({
  preview = false,
  req,
  slug,
}: {
  preview?: boolean;
  req?: PayloadRequest;
  slug: string;
}): Promise<null | PublicPost> {
  if (preview) {
    return queryPostBySlug({ preview: true, req, slug });
  }

  return getCachedPostBySlug(slug);
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  return getCachedSiteSettings();
}

export async function getPublicHomepage(): Promise<PublicHomepage> {
  return getCachedHomepage();
}

export async function getLatestPublicPages(
  limit = LATEST_CONTENT_LIMIT,
): Promise<PublicPage[]> {
  if (limit === LATEST_CONTENT_LIMIT) {
    return getCachedLatestPages(limit);
  }

  return queryLatestPages(limit);
}

export async function getLatestPublicPosts(
  limit = LATEST_CONTENT_LIMIT,
): Promise<PublicPost[]> {
  if (limit === LATEST_CONTENT_LIMIT) {
    return getCachedLatestPosts(limit);
  }

  return queryLatestPosts(limit);
}

type SEOArgs = {
  canonicalPath: string;
  description?: null | string;
  image?: null | PublicMedia;
  siteSettings: PublicSiteSettings;
  title?: null | string;
  type?: "article" | "website";
};

export function buildPublicMetadata({
  canonicalPath,
  description,
  image,
  siteSettings,
  title,
  type = "website",
}: SEOArgs): Metadata {
  const resolvedTitle =
    title ?? siteSettings.defaultSeoTitle ?? siteSettings.siteName ?? DEFAULT_SITE_NAME;
  const resolvedDescription =
    description ??
    siteSettings.defaultSeoDescription ??
    DEFAULT_HOME_DESCRIPTION;
  const imageURL = normalizeImageURL(image?.url ?? null);

  return {
    alternates: {
      canonical: canonicalPath,
    },
    description: resolvedDescription,
    metadataBase: createMetadataBase(),
    openGraph: {
      description: resolvedDescription,
      images: imageURL
        ? [
            {
              alt: image?.altText ?? resolvedTitle,
              url: imageURL,
            },
          ]
        : undefined,
      siteName: siteSettings.siteName,
      title: resolvedTitle,
      type,
      url: canonicalPath,
    },
    title: resolvedTitle,
    twitter: {
      card: imageURL ? "summary_large_image" : "summary",
      description: resolvedDescription,
      images: imageURL ? [imageURL] : undefined,
      title: resolvedTitle,
    },
  };
}

export async function getHomepageMetadata(): Promise<Metadata> {
  const [homepage, siteSettings] = await Promise.all([
    getPublicHomepage(),
    getPublicSiteSettings(),
  ]);

  return buildPublicMetadata({
    canonicalPath: "/",
    description: homepage.seoDescription ?? homepage.hero.description ?? DEFAULT_HOME_DESCRIPTION,
    image: homepage.hero.media,
    siteSettings,
    title: homepage.seoTitle ?? homepage.hero.title ?? DEFAULT_HOME_TITLE,
  });
}
