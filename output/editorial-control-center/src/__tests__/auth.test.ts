import { describe, expect, it } from "vitest";

import {
  getPayloadErrorBody,
  getPayloadErrorStatus,
  isDuplicateEmailError,
  normalizeEmail,
  readAuthCredentials,
  serializeAuthUser,
} from "../lib/auth";
import {
  adminOnlyCollectionAccess,
  adminOrBootstrapUserCreateAccess,
  canCreateDrafts,
  canManageGlobalConfiguration,
  canManageUsers,
  canOverrideEditorialPublishArchive,
  canPublishApprovedContent,
  canReviewSubmissions,
  canUpdateDrafts,
  USER_ROLES,
} from "../lib/permissions";
import { Users } from "../collections/Users";
import payloadConfig from "../payload.config";

describe("authentication helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Editor@Example.COM ")).toBe("editor@example.com");
  });

  it("validates required auth fields", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      body: JSON.stringify({ email: "", password: "" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const result = await readAuthCredentials(request);

    expect("errors" in result).toBe(true);
    if ("errors" in result) {
      expect(result.errors).toHaveLength(2);
    }
  });

  it("serializes the authenticated user shape", () => {
    expect(
      serializeAuthUser({
        collection: "users",
        email: "editor@example.com",
        hash: "hidden",
        id: 7,
        role: "editor",
      }),
    ).toEqual({
      collection: "users",
      email: "editor@example.com",
      id: 7,
      role: "editor",
    });
  });

  it("maps duplicate email validation errors", () => {
    const duplicateEmailError = Object.assign(new Error("duplicate"), {
      data: {
        errors: [{ message: "userEmailAlreadyRegistered", path: "email" }],
      },
      status: 400,
    });

    expect(isDuplicateEmailError(duplicateEmailError)).toBe(true);
    expect(getPayloadErrorStatus(duplicateEmailError)).toBe(400);
    expect(getPayloadErrorBody(duplicateEmailError)).toEqual({
      errors: [{ message: "userEmailAlreadyRegistered", path: "email" }],
      message: "duplicate",
    });
  });

  it("registers an auth-enabled users collection in the payload config", async () => {
    const config = await payloadConfig;
    const usersCollection = config.collections.find(
      (collection) => collection.slug === "users",
    );

    expect(usersCollection).toBeDefined();
    expect(usersCollection?.auth).toBeTruthy();
  });

  it("defines the supported user roles", () => {
    expect(USER_ROLES).toEqual(["admin", "editor", "reviewer"]);
  });

  it("enforces the editorial role matrix", () => {
    const admin = { role: "admin" };
    const editor = { role: "editor" };
    const reviewer = { role: "reviewer" };

    expect(canCreateDrafts(editor)).toBe(true);
    expect(canUpdateDrafts(editor)).toBe(true);
    expect(canPublishApprovedContent(editor)).toBe(false);
    expect(canManageUsers(editor)).toBe(false);
    expect(canManageGlobalConfiguration(editor)).toBe(false);

    expect(canReviewSubmissions(reviewer)).toBe(true);
    expect(canPublishApprovedContent(reviewer)).toBe(true);
    expect(canManageUsers(reviewer)).toBe(false);
    expect(canManageGlobalConfiguration(reviewer)).toBe(false);

    expect(canManageUsers(admin)).toBe(true);
    expect(canManageGlobalConfiguration(admin)).toBe(true);
    expect(canPublishApprovedContent(admin)).toBe(true);
    expect(canOverrideEditorialPublishArchive(admin)).toBe(true);
  });

  it("restricts user management to admins while allowing first-user bootstrap", async () => {
    expect(
      adminOnlyCollectionAccess({
        req: { user: { role: "editor" } },
      } as unknown as Parameters<typeof adminOnlyCollectionAccess>[0]),
    ).toBe(false);

    expect(
      adminOnlyCollectionAccess({
        req: { user: { role: "admin" } },
      } as unknown as Parameters<typeof adminOnlyCollectionAccess>[0]),
    ).toBe(true);

    await expect(
      adminOrBootstrapUserCreateAccess({
        req: {
          payload: {
            count: async () => ({ totalDocs: 0 }),
          },
          user: null,
        },
      } as unknown as Parameters<typeof adminOrBootstrapUserCreateAccess>[0]),
    ).resolves.toBe(true);
  });

  it("adds a JWT-backed role field to the users collection", () => {
    const roleField = Users.fields.find(
      (field): field is Extract<(typeof Users.fields)[number], { name: "role" }> =>
        "name" in field && field.name === "role",
    );

    expect(roleField).toMatchObject({
      defaultValue: "editor",
      name: "role",
      required: true,
      saveToJWT: true,
      type: "select",
    });
  });
});
