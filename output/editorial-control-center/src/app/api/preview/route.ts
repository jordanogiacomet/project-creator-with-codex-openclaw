import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { createAuthRequest } from "@/lib/auth";
import { withRequestLogging } from "@/lib/logger";
import { EDITORIAL_ROLES, hasAnyRole } from "@/lib/permissions";
import {
  applyPreviewHeaders,
  parsePreviewLookup,
  resolvePreviewContent,
} from "@/lib/preview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getPreview(request: Request) {
  const req = await createAuthRequest(request);

  if (!req.user) {
    return applyPreviewHeaders(
      NextResponse.json({ message: "Authentication required." }, { status: 401 }),
    );
  }

  if (!hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return applyPreviewHeaders(
      NextResponse.json({ message: "Forbidden." }, { status: 403 }),
    );
  }

  const parsedLookup = parsePreviewLookup(new URL(request.url).searchParams);

  if ("error" in parsedLookup) {
    return applyPreviewHeaders(
      NextResponse.json({ message: parsedLookup.error }, { status: 400 }),
    );
  }

  const resolvedPreview = await resolvePreviewContent({
    ...parsedLookup.data,
    req,
  });

  if (!resolvedPreview) {
    return applyPreviewHeaders(
      NextResponse.json({ message: "Preview content was not found." }, { status: 404 }),
    );
  }

  const preview = await draftMode();
  preview.enable();

  return applyPreviewHeaders(
    NextResponse.redirect(new URL(resolvedPreview.pathname, request.url), {
      status: 307,
    }),
  );
}

export const GET = withRequestLogging(getPreview, "api");
