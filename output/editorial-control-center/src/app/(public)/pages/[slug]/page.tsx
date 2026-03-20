import { RichText } from "@payloadcms/richtext-lexical/react";
import { notFound } from "next/navigation";

import PublicImage from "@/components/PublicImage";
import {
  buildPublicMetadata,
  getPublicPageBySlug,
  getPublicSiteSettings,
} from "@/lib/public-content";
import {
  getElapsedMilliseconds,
  logRequestComplete,
  startRequestTimer,
} from "@/lib/logger";
import { getPreviewState } from "@/lib/preview";

type Args = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function formatPublishedDate(value: null | string): null | string {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: Args) {
  const { slug } = await params;
  const preview = await getPreviewState();
  const [page, siteSettings] = await Promise.all([
    getPublicPageBySlug({
      preview: preview.isEnabled,
      req: preview.req,
      slug,
    }),
    getPublicSiteSettings(),
  ]);

  if (!page) {
    const metadata = buildPublicMetadata({
      canonicalPath: `/pages/${slug}`,
      siteSettings,
      title: siteSettings.siteName,
    });

    return preview.isEnabled
      ? {
          ...metadata,
          robots: {
            follow: false,
            googleBot: {
              follow: false,
              index: false,
            },
            index: false,
          },
        }
      : metadata;
  }

  const metadata = buildPublicMetadata({
    canonicalPath: `/pages/${page.slug}`,
    description: page.seoDescription,
    image: page.hero,
    siteSettings,
    title: page.seoTitle ?? page.title,
  });

  return preview.isEnabled
    ? {
        ...metadata,
        robots: {
          follow: false,
          googleBot: {
            follow: false,
            index: false,
          },
          index: false,
        },
      }
    : metadata;
}

export default async function PublicPage({ params }: Args) {
  const startedAt = startRequestTimer();
  const { slug } = await params;
  const preview = await getPreviewState();
  const page = await getPublicPageBySlug({
    preview: preview.isEnabled,
    req: preview.req,
    slug,
  });
  const pathname = `/pages/${slug}`;

  if (!page) {
    logRequestComplete({
      method: "GET",
      pathname,
      preview: preview.isEnabled,
      responseTimeMs: getElapsedMilliseconds(startedAt),
      routeKind: "public-page",
      status: 404,
    });

    notFound();
  }

  logRequestComplete({
    method: "GET",
    pathname,
    preview: preview.isEnabled,
    responseTimeMs: getElapsedMilliseconds(startedAt),
    routeKind: "public-page",
    status: 200,
  });

  return (
    <main>
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Page
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {page.title}
          </h1>
          {page.publishedAt ? (
            <p className="text-sm text-slate-500">{formatPublishedDate(page.publishedAt)}</p>
          ) : null}
        </header>

        {page.hero?.url ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100">
            <PublicImage
              alt={page.hero.altText ?? page.title}
              className="object-cover"
              fill
              src={page.hero.url}
            />
          </div>
        ) : null}

        {page.body ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <RichText data={page.body} />
          </div>
        ) : null}
      </article>
    </main>
  );
}
