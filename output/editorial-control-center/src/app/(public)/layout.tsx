import type { ReactNode } from "react";

import PublicLayout from "@/components/PublicLayout";

type LayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: LayoutProps) {
  return <PublicLayout>{children}</PublicLayout>;
}
