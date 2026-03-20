import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { getPublicSiteSettings } from "@/lib/public-content";

type PublicLayoutProps = {
  children: ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const siteSettings = await getPublicSiteSettings();
  const hasNavigation = siteSettings.navigation.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <Link
            className="text-lg font-semibold tracking-tight text-slate-950 transition hover:text-slate-700"
            href="/"
          >
            {siteSettings.siteName}
          </Link>

          {hasNavigation ? (
            <nav aria-label="Public" className="flex flex-wrap items-center gap-4 text-sm">
              {siteSettings.navigation.map((item) => (
                <Link
                  className="text-slate-700 transition hover:text-slate-950"
                  href={item.href}
                  key={`${item.href}-${item.label}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">{children}</div>

      {siteSettings.footer ? (
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-8 text-sm leading-6 text-slate-600">
            <RichText data={siteSettings.footer} />
          </div>
        </footer>
      ) : null}
    </div>
  );
}
