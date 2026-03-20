import Link from "next/link";

import PublicImage from "@/components/PublicImage";
import {
  getHomepageMetadata,
  getPublicHomepage,
  type PublicPage,
  type PublicPost,
} from "@/lib/public-content";
import {
  getElapsedMilliseconds,
  logRequestComplete,
  startRequestTimer,
} from "@/lib/logger";

export const dynamic = "force-dynamic";

function formatPublishedDate(value: null | string): null | string {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(value));
}

function PageCard({ page }: { page: PublicPage }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            <Link className="transition hover:text-slate-700" href={`/pages/${page.slug}`}>
              {page.title}
            </Link>
          </h3>
          {page.publishedAt ? (
            <p className="text-sm text-slate-500">{formatPublishedDate(page.publishedAt)}</p>
          ) : null}
        </div>

        {page.seoDescription ? (
          <p className="text-sm leading-6 text-slate-600">{page.seoDescription}</p>
        ) : null}
      </div>
    </article>
  );
}

function PostCard({ post }: { post: PublicPost }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            <Link className="transition hover:text-slate-700" href={`/posts/${post.slug}`}>
              {post.title}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {post.author ? <span>By {post.author.name}</span> : null}
            {post.publishedAt ? <span>{formatPublishedDate(post.publishedAt)}</span> : null}
          </div>
        </div>

        {post.excerpt ? <p className="text-sm leading-6 text-slate-600">{post.excerpt}</p> : null}
      </div>
    </article>
  );
}

export async function generateMetadata() {
  return getHomepageMetadata();
}

export default async function PublicHomePage() {
  const startedAt = startRequestTimer();
  const homepage = await getPublicHomepage();
  const posts = homepage.featuredPosts.length > 0 ? homepage.featuredPosts : homepage.latestPosts;
  const pages = homepage.featuredPages.length > 0 ? homepage.featuredPages : homepage.latestPages;

  logRequestComplete({
    method: "GET",
    pathname: "/",
    responseTimeMs: getElapsedMilliseconds(startedAt),
    routeKind: "public-page",
    status: 200,
  });

  return (
    <main className="space-y-12">
      <section className="grid gap-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Public Site
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {homepage.hero.title ?? "Editorial Control Center"}
            </h1>

            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              {homepage.hero.description ??
                "Published pages and editorial posts are rendered here from the CMS."}
            </p>
          </div>
        </div>

        {homepage.hero.media?.url ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
            <PublicImage
              alt={homepage.hero.media.altText ?? homepage.hero.title ?? "Homepage media"}
              className="object-cover"
              fill
              src={homepage.hero.media.url}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              {homepage.featuredPages.length > 0 ? "Featured" : "Latest"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Pages</h2>
          </div>
        </div>

        {pages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <PageCard key={page.id} page={page} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">
            No published pages are available yet.
          </p>
        )}
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            {homepage.featuredPosts.length > 0 ? "Featured" : "Latest"}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Posts</h2>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">
            No published posts are available yet.
          </p>
        )}
      </section>
    </main>
  );
}
