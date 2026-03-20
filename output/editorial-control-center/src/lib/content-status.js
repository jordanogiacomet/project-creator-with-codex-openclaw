import { ValidationError } from "payload";

import {
  EDITORIAL_ROLES,
  canPublishApprovedContent,
  hasAnyRole,
} from "./permissions.js";

export const CONTENT_STATUSES = ["draft", "in_review", "published"];

export const CONTENT_STATUS_OPTIONS = [
  {
    label: "Draft",
    value: "draft",
  },
  {
    label: "In Review",
    value: "in_review",
  },
  {
    label: "Published",
    value: "published",
  },
];

export function isContentStatus(value) {
  return typeof value === "string" && CONTENT_STATUSES.includes(value);
}

export function getContentStatus(doc, fallback = "draft") {
  if (isContentStatus(doc?.content_status)) {
    return doc.content_status;
  }

  if (doc?.published_at) {
    return "published";
  }

  return fallback;
}

export function createEditorialWorkflowFields() {
  return [
    {
      name: "content_status",
      label: "Editorial Status",
      type: "select",
      defaultValue: "draft",
      index: true,
      options: [...CONTENT_STATUS_OPTIONS],
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "published_at",
      label: "Published At",
      type: "date",
      index: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
        readOnly: true,
      },
    },
  ];
}

export function getPublicContentWhere({ preview = false } = {}) {
  if (preview) {
    return undefined;
  }

  return {
    and: [
      {
        content_status: {
          equals: "published",
        },
      },
      {
        published_at: {
          exists: true,
        },
      },
    ],
  };
}

export function getPublicContentQuery({ preview = false } = {}) {
  const where = getPublicContentWhere({ preview });

  return where ? { where } : {};
}

function getRequestedContentStatus(data, fallback) {
  if (isContentStatus(data?.content_status)) {
    return data.content_status;
  }

  return fallback;
}

function createContentStatusError(collectionSlug, message, req) {
  return new ValidationError({
    collection: collectionSlug,
    errors: [
      {
        message,
        path: "content_status",
      },
    ],
    req,
  });
}

function assertCanPublish({ collectionSlug, req }) {
  if (canPublishApprovedContent(req.user)) {
    return;
  }

  throw createContentStatusError(
    collectionSlug,
    "Publishing requires an admin or reviewer role.",
    req,
  );
}

export function applyEditorialWorkflow({
  collection,
  data,
  operation,
  originalDoc,
  req,
}) {
  const currentStatus = getContentStatus(originalDoc);
  const fallbackStatus = operation === "create" ? "draft" : currentStatus;
  const requestedStatus = getRequestedContentStatus(data, fallbackStatus);
  const publishedAt =
    typeof originalDoc?.published_at === "string" ? originalDoc.published_at : null;

  if (!hasAnyRole(req.user, EDITORIAL_ROLES)) {
    throw createContentStatusError(
      collection.slug,
      "Editing content requires an authenticated editorial role.",
      req,
    );
  }

  if (requestedStatus === "published") {
    assertCanPublish({
      collectionSlug: collection.slug,
      req,
    });
  }

  return {
    ...data,
    content_status: requestedStatus,
    published_at:
      requestedStatus === "published"
        ? publishedAt ?? new Date().toISOString()
        : publishedAt,
  };
}

export const editorialWorkflowBeforeChange = applyEditorialWorkflow;

export const editorialContentCreateAccess = ({ data, req }) => {
  if (!hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return false;
  }

  const requestedStatus = getRequestedContentStatus(data, "draft");

  return requestedStatus !== "published" || canPublishApprovedContent(req.user);
};

export const editorialContentReadAccess = ({ req }) => {
  if (hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return true;
  }

  return getPublicContentWhere();
};

export const editorialContentUpdateAccess = ({ data, req }) => {
  if (!hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return false;
  }

  const requestedStatus = data
    ? getRequestedContentStatus(data, "draft")
    : undefined;

  return (
    requestedStatus !== "published" || canPublishApprovedContent(req.user)
  );
};
