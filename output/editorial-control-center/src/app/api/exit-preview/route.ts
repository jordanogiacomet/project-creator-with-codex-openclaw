import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { withRequestLogging } from "@/lib/logger";
import { applyPreviewHeaders, sanitizePreviewExitPath } from "@/lib/preview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getExitPreview(request: Request) {
  const preview = await draftMode();
  preview.disable();

  const pathname = sanitizePreviewExitPath(
    new URL(request.url).searchParams.get("path")?.trim() ?? null,
  );

  return applyPreviewHeaders(
    NextResponse.redirect(new URL(pathname, request.url), {
      status: 307,
    }),
  );
}

export const GET = withRequestLogging(getExitPreview, "api");
