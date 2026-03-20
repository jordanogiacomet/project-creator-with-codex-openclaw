import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-slate-200 px-6 py-5 md:w-64 md:border-b-0 md:border-r">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Editorial Control Center
              </p>
              <p className="mt-2 text-sm text-slate-600">Application shell placeholder</p>
            </div>

            <nav aria-label="Primary" className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Navigation
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Dashboard</li>
                <li>Content</li>
                <li>Media</li>
              </ul>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
