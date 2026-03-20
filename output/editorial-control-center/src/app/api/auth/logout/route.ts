import { NextResponse } from "next/server";
import { logoutOperation } from "payload";

import {
  buildExpiredAuthCookie,
  createAuthRequest,
  getUsersCollection,
} from "@/lib/auth";
import { withRequestLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function postLogout(request: Request) {
  const req = await createAuthRequest(request);
  const payload = req.payload;
  const usersCollection = getUsersCollection(payload);

  if (req.user) {
    await logoutOperation({
      collection: usersCollection,
      req,
    });
  }

  const response = NextResponse.json(
    { message: "Logged out successfully." },
    { status: 200 },
  );

  response.headers.set("Set-Cookie", buildExpiredAuthCookie(payload));

  return response;
}

export const POST = withRequestLogging(postLogout, "api");
