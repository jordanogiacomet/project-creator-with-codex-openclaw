import type { Access, PayloadRequest } from "payload";

export const USER_ROLES = ["admin", "editor", "reviewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES = ["admin"] as const satisfies readonly UserRole[];
export const DRAFT_EDITOR_ROLES = ["admin", "editor"] as const satisfies readonly UserRole[];
export const REVIEWER_ROLES = ["admin", "reviewer"] as const satisfies readonly UserRole[];
export const EDITORIAL_ROLES = [
  "admin",
  "editor",
  "reviewer",
] as const satisfies readonly UserRole[];

export const USER_ROLE_OPTIONS = USER_ROLES.map((role) => ({
  label: role[0].toUpperCase() + role.slice(1),
  value: role,
}));

const USERS_COLLECTION = "users";

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function getUserRole(user: unknown): UserRole | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const { role } = user as { role?: unknown };

  return isUserRole(role) ? role : null;
}

export function hasAnyRole(
  user: unknown,
  roles: readonly UserRole[],
): boolean {
  const role = getUserRole(user);

  return role !== null && roles.includes(role);
}

export function canCreateDrafts(user: unknown): boolean {
  return hasAnyRole(user, DRAFT_EDITOR_ROLES);
}

export function canUpdateDrafts(user: unknown): boolean {
  return hasAnyRole(user, DRAFT_EDITOR_ROLES);
}

export function canReviewSubmissions(user: unknown): boolean {
  return hasAnyRole(user, REVIEWER_ROLES);
}

export function canPublishApprovedContent(user: unknown): boolean {
  return hasAnyRole(user, REVIEWER_ROLES);
}

export function canManageUsers(user: unknown): boolean {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function canManageGlobalConfiguration(user: unknown): boolean {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function canOverrideEditorialPublishArchive(user: unknown): boolean {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function createRoleAccess(roles: readonly UserRole[]): Access {
  return ({ req }) => hasAnyRole(req.user, roles);
}

export const adminOnlyCollectionAccess = createRoleAccess(ADMIN_ROLES);
export const adminOnlyGlobalAccess = createRoleAccess(ADMIN_ROLES);
export const editorialCollectionReadAccess = createRoleAccess(EDITORIAL_ROLES);
export const editorialDraftCreateAccess = createRoleAccess(DRAFT_EDITOR_ROLES);
export const editorialDraftUpdateAccess = createRoleAccess(DRAFT_EDITOR_ROLES);
export const editorialReviewAccess = createRoleAccess(REVIEWER_ROLES);
export const editorialPublishAccess = createRoleAccess(REVIEWER_ROLES);

export async function isFirstUserBootstrapRequest(
  req: PayloadRequest,
): Promise<boolean> {
  const result = await req.payload.count({
    collection: USERS_COLLECTION,
    overrideAccess: true,
    req,
  });

  return result.totalDocs === 0;
}

export const adminOrBootstrapUserCreateAccess: Access = async ({ req }) => {
  if (canManageUsers(req.user)) {
    return true;
  }

  return isFirstUserBootstrapRequest(req);
};
