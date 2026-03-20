import { NextResponse } from "next/server";

import {
  buildAuthCookie,
  createAuthRequest,
  findUserByEmail,
  getPayloadErrorBody,
  getPayloadErrorStatus,
  isDuplicateEmailError,
  serializeAuthUser,
  USERS_COLLECTION,
  readAuthCredentials,
} from "@/lib/auth";
import {
  canManageUsers,
  isFirstUserBootstrapRequest,
  isUserRole,
} from "@/lib/permissions";
import { withRequestLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function postRegister(request: Request) {
  const requestBody = await request.clone().json().catch(() => null);
  const parsedCredentials = await readAuthCredentials(request);

  if ("errors" in parsedCredentials) {
    return NextResponse.json(
      { errors: parsedCredentials.errors, message: "Invalid registration payload." },
      { status: 400 },
    );
  }

  const req = await createAuthRequest(request);
  const payload = req.payload;
  const { email, password } = parsedCredentials.data;
  const requestedRole =
    requestBody && typeof requestBody === "object"
      ? (requestBody as { role?: unknown }).role
      : undefined;
  const isBootstrapRequest = await isFirstUserBootstrapRequest(req);

  if (!isBootstrapRequest && !req.user) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  if (!isBootstrapRequest && !canManageUsers(req.user)) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 },
    );
  }

  if (requestedRole !== undefined && !isUserRole(requestedRole)) {
    return NextResponse.json(
      {
        errors: [{ message: "Role must be admin, editor, or reviewer.", path: "role" }],
        message: "Invalid registration payload.",
      },
      { status: 400 },
    );
  }

  const role = isBootstrapRequest
    ? "admin"
    : isUserRole(requestedRole)
      ? requestedRole
      : "editor";

  const existingUser = await findUserByEmail({ email, payload, req });

  if (existingUser) {
    return NextResponse.json(
      {
        errors: [{ message: "A user with that email already exists.", path: "email" }],
        message: "Email already registered.",
      },
      { status: 409 },
    );
  }

  try {
    const user = await payload.create({
      collection: USERS_COLLECTION,
      data: {
        email,
        password,
        role,
      },
      req,
    });

    if (!isBootstrapRequest) {
      return NextResponse.json(
        {
          user: serializeAuthUser(user),
        },
        { status: 201 },
      );
    }

    const session = await payload.login({
      collection: USERS_COLLECTION,
      data: {
        email,
        password,
      },
      req,
    });

    const response = NextResponse.json(
      {
        exp: session.exp,
        token: session.token,
        user: serializeAuthUser(user),
      },
      { status: 201 },
    );

    if (session.token) {
      response.headers.set("Set-Cookie", buildAuthCookie(payload, session.token));
    }

    return response;
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json(
        {
          errors: [{ message: "A user with that email already exists.", path: "email" }],
          message: "Email already registered.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(getPayloadErrorBody(error), {
      status: getPayloadErrorStatus(error, 400),
    });
  }
}

export const POST = withRequestLogging(postRegister, "api");
