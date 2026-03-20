import { NextResponse } from "next/server";

import {
  buildAuthCookie,
  createAuthRequest,
  getPayloadErrorBody,
  getPayloadErrorStatus,
  serializeAuthUser,
  USERS_COLLECTION,
  readAuthCredentials,
} from "@/lib/auth";
import { withRequestLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function postLogin(request: Request) {
  const parsedCredentials = await readAuthCredentials(request);

  if ("errors" in parsedCredentials) {
    return NextResponse.json(
      { errors: parsedCredentials.errors, message: "Invalid login payload." },
      { status: 400 },
    );
  }

  const req = await createAuthRequest(request);
  const payload = req.payload;

  try {
    const session = await payload.login({
      collection: USERS_COLLECTION,
      data: parsedCredentials.data,
      req,
    });

    const response = NextResponse.json(
      {
        exp: session.exp,
        token: session.token,
        user: serializeAuthUser(session.user),
      },
      { status: 200 },
    );

    if (session.token) {
      response.headers.set("Set-Cookie", buildAuthCookie(payload, session.token));
    }

    return response;
  } catch (error) {
    return NextResponse.json(getPayloadErrorBody(error), {
      status: getPayloadErrorStatus(error, 401),
    });
  }
}

export const POST = withRequestLogging(postLogin, "api");
