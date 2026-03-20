export const USER_ROLES = ["admin", "editor", "reviewer"];

export const ADMIN_ROLES = ["admin"];
export const DRAFT_EDITOR_ROLES = ["admin", "editor"];
export const REVIEWER_ROLES = ["admin", "reviewer"];
export const EDITORIAL_ROLES = ["admin", "editor", "reviewer"];

export const USER_ROLE_OPTIONS = USER_ROLES.map((role) => ({
  label: role[0].toUpperCase() + role.slice(1),
  value: role,
}));

const USERS_COLLECTION = "users";

export function isUserRole(value) {
  return typeof value === "string" && USER_ROLES.includes(value);
}

export function getUserRole(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return isUserRole(user.role) ? user.role : null;
}

export function hasAnyRole(user, roles) {
  const role = getUserRole(user);

  return role !== null && roles.includes(role);
}

export function canCreateDrafts(user) {
  return hasAnyRole(user, DRAFT_EDITOR_ROLES);
}

export function canUpdateDrafts(user) {
  return hasAnyRole(user, DRAFT_EDITOR_ROLES);
}

export function canReviewSubmissions(user) {
  return hasAnyRole(user, REVIEWER_ROLES);
}

export function canPublishApprovedContent(user) {
  return hasAnyRole(user, REVIEWER_ROLES);
}

export function canManageUsers(user) {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function canManageGlobalConfiguration(user) {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function canOverrideEditorialPublishArchive(user) {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function createRoleAccess(roles) {
  return ({ req }) => hasAnyRole(req.user, roles);
}

export const adminOnlyCollectionAccess = createRoleAccess(ADMIN_ROLES);
export const adminOnlyGlobalAccess = createRoleAccess(ADMIN_ROLES);
export const editorialCollectionReadAccess = createRoleAccess(EDITORIAL_ROLES);
export const editorialDraftCreateAccess = createRoleAccess(DRAFT_EDITOR_ROLES);
export const editorialDraftUpdateAccess = createRoleAccess(DRAFT_EDITOR_ROLES);
export const editorialReviewAccess = createRoleAccess(REVIEWER_ROLES);
export const editorialPublishAccess = createRoleAccess(REVIEWER_ROLES);

export async function isFirstUserBootstrapRequest(req) {
  const result = await req.payload.count({
    collection: USERS_COLLECTION,
    overrideAccess: true,
    req,
  });

  return result.totalDocs === 0;
}

export const adminOrBootstrapUserCreateAccess = async ({ req }) => {
  if (canManageUsers(req.user)) {
    return true;
  }

  return isFirstUserBootstrapRequest(req);
};
