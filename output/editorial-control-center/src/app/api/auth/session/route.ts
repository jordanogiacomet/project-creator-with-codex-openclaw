import { NextResponse } from "next/server";

import { createAuthRequest, serializeAuthUser } from "@/lib/auth";
import { withRequestLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getSession(request: Request) {
  const req = await createAuthRequest(request);

  if (!req.user) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { user: serializeAuthUser(req.user) },
    { status: 200 },
  );
}

export const GET = withRequestLogging(getSession, "api");
