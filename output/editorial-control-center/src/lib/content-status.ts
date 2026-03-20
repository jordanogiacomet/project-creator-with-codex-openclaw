import type {
  Access,
  CollectionBeforeChangeHook,
  Field,
  PayloadRequest,
  Where,
} from "payload";
import { ValidationError } from "payload";

import {
  EDITORIAL_ROLES,
  canPublishApprovedContent,
  hasAnyRole,
} from "./permissions";

export const CONTENT_STATUSES = ["draft", "in_review", "published"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

type ContentStatusDocument = {
  content_status?: unknown;
  published_at?: unknown;
};

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
] as const;

export function isContentStatus(value: unknown): value is ContentStatus {
  return (
    typeof value === "string" &&
    CONTENT_STATUSES.includes(value as ContentStatus)
  );
}

export function getContentStatus(
  doc: ContentStatusDocument | null | undefined,
  fallback: ContentStatus = "draft",
): ContentStatus {
  if (isContentStatus(doc?.content_status)) {
    return doc.content_status;
  }

  if (doc?.published_at) {
    return "published";
  }

  return fallback;
}

export function createEditorialWorkflowFields(): Field[] {
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

export function getPublicContentWhere({
  preview = false,
}: {
  preview?: boolean;
} = {}): Where | undefined {
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

export function getPublicContentQuery({
  preview = false,
}: {
  preview?: boolean;
} = {}): {
  where?: Where;
} {
  const where = getPublicContentWhere({ preview });

  return where ? { where } : {};
}

function getRequestedContentStatus(
  data: Partial<ContentStatusDocument> | undefined,
  fallback: ContentStatus,
): ContentStatus {
  if (isContentStatus(data?.content_status)) {
    return data.content_status;
  }

  return fallback;
}

function createContentStatusError(
  collectionSlug: string,
  message: string,
  req: PayloadRequest,
): ValidationError {
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

function assertCanPublish({
  collectionSlug,
  req,
}: {
  collectionSlug: string;
  req: PayloadRequest;
}): void {
  if (canPublishApprovedContent(req.user)) {
    return;
  }

  throw createContentStatusError(
    collectionSlug,
    "Publishing requires an admin or reviewer role.",
    req,
  );
}

export function applyEditorialWorkflow(
  args: Pick<
    Parameters<CollectionBeforeChangeHook>[0],
    "collection" | "data" | "operation" | "originalDoc" | "req"
  >,
): Partial<ContentStatusDocument> {
  const { collection, data, operation, originalDoc, req } = args;
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

export const editorialWorkflowBeforeChange: CollectionBeforeChangeHook =
  applyEditorialWorkflow;

export const editorialContentCreateAccess: Access = ({ data, req }) => {
  if (!hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return false;
  }

  const requestedStatus = getRequestedContentStatus(data, "draft");

  return requestedStatus !== "published" || canPublishApprovedContent(req.user);
};

export const editorialContentReadAccess: Access = ({ req }) => {
  if (hasAnyRole(req.user, EDITORIAL_ROLES)) {
    return true;
  }

  return getPublicContentWhere() as Where;
};

export const editorialContentUpdateAccess: Access = ({ data, req }) => {
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
