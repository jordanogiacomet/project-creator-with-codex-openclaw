import config from "../payload.config";
import {
  createPayloadRequest,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  type Payload,
  type PayloadRequest,
} from "payload";

import { getUserRole, type UserRole } from "./permissions";

export const USERS_COLLECTION = "users";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthValidationError = {
  message: string;
  path?: string;
};

type PayloadErrorLike = Error & {
  data?: {
    errors?: AuthValidationError[];
  };
  status?: number;
};

export async function createAuthRequest(
  request: Request,
): Promise<PayloadRequest> {
  return createPayloadRequest({ config, request });
}

export function getUsersCollection(payload: Payload) {
  const collection = payload.collections[USERS_COLLECTION];

  if (!collection?.config.auth) {
    throw new Error("Users collection auth is not configured.");
  }

  return collection;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function readAuthCredentials(
  request: Request,
): Promise<
  | { data: AuthCredentials; errors?: never }
  | { data?: never; errors: AuthValidationError[] }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      errors: [{ message: "Request body must be valid JSON." }],
    };
  }

  if (!body || typeof body !== "object") {
    return {
      errors: [{ message: "Request body must be a JSON object." }],
    };
  }

  const email = "email" in body ? body.email : undefined;
  const password = "password" in body ? body.password : undefined;
  const errors: AuthValidationError[] = [];

  if (typeof email !== "string" || email.trim() === "") {
    errors.push({
      message: "Email is required.",
      path: "email",
    });
  }

  if (typeof password !== "string" || password.length === 0) {
    errors.push({
      message: "Password is required.",
      path: "password",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      email: normalizeEmail(email as string),
      password: password as string,
    },
  };
}

export async function findUserByEmail({
  email,
  payload,
  req,
}: {
  email: string;
  payload: Payload;
  req: PayloadRequest;
}) {
  const result = await payload.find({
    collection: USERS_COLLECTION,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      email: {
        equals: email,
      },
    },
  });

  return result.docs[0] ?? null;
}

export function serializeAuthUser(user: unknown): {
  collection: string | null;
  email: string | null;
  id: number | string | null;
  role: UserRole | null;
} {
  if (!user || typeof user !== "object") {
    return {
      collection: null,
      email: null,
      id: null,
      role: null,
    };
  }

  const authUser = user as {
    collection?: unknown;
    email?: unknown;
    id?: unknown;
  };

  return {
    collection:
      typeof authUser.collection === "string" ? authUser.collection : null,
    email: typeof authUser.email === "string" ? authUser.email : null,
    id:
      typeof authUser.id === "number" || typeof authUser.id === "string"
        ? authUser.id
        : null,
    role: getUserRole(user),
  };
}

export function buildAuthCookie(payload: Payload, token: string): string {
  const usersCollection = getUsersCollection(payload);

  return generatePayloadCookie({
    collectionAuthConfig: usersCollection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  });
}

export function buildExpiredAuthCookie(payload: Payload): string {
  const usersCollection = getUsersCollection(payload);

  return generateExpiredPayloadCookie({
    collectionAuthConfig: usersCollection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
  });
}

export function getPayloadErrorStatus(
  error: unknown,
  fallbackStatus = 500,
): number {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return fallbackStatus;
}

export function getPayloadErrorBody(
  error: unknown,
  fallbackMessage = "Authentication request failed.",
): {
  errors?: AuthValidationError[];
  message: string;
} {
  if (!(error instanceof Error)) {
    return { message: fallbackMessage };
  }

  const payloadError = error as PayloadErrorLike;
  const message = payloadError.message || fallbackMessage;
  const errors =
    payloadError.data &&
    typeof payloadError.data === "object" &&
    Array.isArray(payloadError.data.errors)
      ? payloadError.data.errors.filter(
          (validationError): validationError is AuthValidationError =>
            Boolean(validationError?.message),
        )
      : undefined;

  return errors && errors.length > 0 ? { errors, message } : { message };
}

export function isDuplicateEmailError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const payloadError = error as PayloadErrorLike;
  const validationErrors = Array.isArray(payloadError.data?.errors)
    ? payloadError.data.errors
    : [];

  return validationErrors.some(
    (validationError) =>
      validationError.path === "email" &&
      validationError.message.toLowerCase().includes("registered"),
  );
}
