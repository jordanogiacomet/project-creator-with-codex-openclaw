import {
  USER_ROLE_OPTIONS,
  adminOnlyCollectionAccess,
  adminOrBootstrapUserCreateAccess,
  canManageUsers,
  isFirstUserBootstrapRequest,
} from "../lib/permissions.js";

export const Users = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    tokenExpiration: 60 * 60 * 2,
    useSessions: true,
  },
  access: {
    admin: ({ req }) => canManageUsers(req.user),
    create: adminOrBootstrapUserCreateAccess,
    delete: adminOnlyCollectionAccess,
    read: adminOnlyCollectionAccess,
    update: adminOnlyCollectionAccess,
  },
  fields: [
    {
      name: "role",
      type: "select",
      defaultValue: "editor",
      options: USER_ROLE_OPTIONS,
      required: true,
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== "create") {
          return data;
        }

        if (!(await isFirstUserBootstrapRequest(req))) {
          return data;
        }

        return {
          ...data,
          role: "admin",
        };
      },
    ],
  },
};
