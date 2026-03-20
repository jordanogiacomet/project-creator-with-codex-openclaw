import { RichText } from "@payloadcms/richtext-lexical/react";
import { notFound } from "next/navigation";

import PublicImage from "@/components/PublicImage";
import {
  buildPublicMetadata,
  getPublicPostBySlug,
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
  const [post, siteSettings] = await Promise.all([
    getPublicPostBySlug({
      preview: preview.isEnabled,
      req: preview.req,
      slug,
    }),
    getPublicSiteSettings(),
  ]);

  if (!post) {
    const metadata = buildPublicMetadata({
      canonicalPath: `/posts/${slug}`,
      siteSettings,
      title: siteSettings.siteName,
      type: "article",
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
    canonicalPath: `/posts/${post.slug}`,
    description: post.excerpt,
    image: post.featuredImage,
    siteSettings,
    title: post.title,
    type: "article",
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

export default async function PublicPost({ params }: Args) {
  const startedAt = startRequestTimer();
  const { slug } = await params;
  const preview = await getPreviewState();
  const post = await getPublicPostBySlug({
    preview: preview.isEnabled,
    req: preview.req,
    slug,
  });
  const pathname = `/posts/${slug}`;

  if (!post) {
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
            Post
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {post.author ? <span>By {post.author.name}</span> : null}
              {post.publishedAt ? <span>{formatPublishedDate(post.publishedAt)}</span> : null}
            </div>

            {post.excerpt ? (
              <p className="max-w-3xl text-base leading-7 text-slate-600">{post.excerpt}</p>
            ) : null}
          </div>
        </header>

        {post.featuredImage?.url ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100">
            <PublicImage
              alt={post.featuredImage.altText ?? post.title}
              className="object-cover"
              fill
              src={post.featuredImage.url}
            />
          </div>
        ) : null}

        {post.body ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <RichText data={post.body} />
          </div>
        ) : null}

        {post.author ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Author
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {post.author.name}
              </h2>
              {post.author.bio ? (
                <p className="max-w-2xl text-sm leading-6 text-slate-600">{post.author.bio}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
