import { ValidationError } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Pages } from "../collections/Pages";
import { Posts } from "../collections/Posts";
import {
  applyEditorialWorkflow,
  CONTENT_STATUSES,
  editorialContentCreateAccess,
  editorialContentReadAccess,
  editorialWorkflowBeforeChange,
  getPublicContentQuery,
  getPublicContentWhere,
} from "../lib/content-status";

type CreateAccessArgs = Parameters<typeof editorialContentCreateAccess>[0];
type ReadAccessArgs = Parameters<typeof editorialContentReadAccess>[0];
type WorkflowArgs = Parameters<typeof applyEditorialWorkflow>[0];

const asCreateAccessArgs = (args: object): CreateAccessArgs =>
  args as unknown as CreateAccessArgs;

const asReadAccessArgs = (args: object): ReadAccessArgs =>
  args as unknown as ReadAccessArgs;

const asWorkflowReq = (role: string): WorkflowArgs["req"] =>
  ({ user: { role } }) as unknown as WorkflowArgs["req"];

describe("draft and publish workflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-19T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defines the supported editorial states", () => {
    expect(CONTENT_STATUSES).toEqual(["draft", "in_review", "published"]);
  });

  it("filters public content reads to published entries unless preview is active", () => {
    expect(getPublicContentWhere()).toEqual({
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
    });

    expect(getPublicContentQuery()).toEqual({
      where: getPublicContentWhere(),
    });
    expect(getPublicContentQuery({ preview: true })).toEqual({});

    expect(
      editorialContentReadAccess(
        asReadAccessArgs({
        req: { user: null },
        }),
      ),
    ).toEqual(getPublicContentWhere());
  });

  it("allows editors to save drafts but reserves publishing for reviewers and admins", () => {
    expect(
      editorialContentCreateAccess(
        asCreateAccessArgs({
        data: {
          content_status: "draft",
        },
        req: { user: { role: "editor" } },
        }),
      ),
    ).toBe(true);

    expect(
      editorialContentCreateAccess(
        asCreateAccessArgs({
        data: {
          content_status: "published",
        },
        req: { user: { role: "editor" } },
        }),
      ),
    ).toBe(false);

    expect(
      editorialContentCreateAccess(
        asCreateAccessArgs({
        data: {
          content_status: "published",
        },
        req: { user: { role: "reviewer" } },
        }),
      ),
    ).toBe(true);
  });

  it("records a canonical published timestamp when content is published", () => {
    expect(
      applyEditorialWorkflow({
        collection: { slug: "posts" } as Parameters<typeof applyEditorialWorkflow>[0]["collection"],
        data: {
          content_status: "published",
        },
        operation: "create",
        req: asWorkflowReq("reviewer"),
      }),
    ).toMatchObject({
      content_status: "published",
      published_at: "2026-03-19T12:34:56.000Z",
    });
  });

  it("preserves the original published timestamp and supports send-back from review", () => {
    expect(
      applyEditorialWorkflow({
        collection: { slug: "posts" } as Parameters<typeof applyEditorialWorkflow>[0]["collection"],
        data: {
          content_status: "draft",
        },
        operation: "update",
        originalDoc: {
          content_status: "in_review",
        },
        req: asWorkflowReq("reviewer"),
      }),
    ).toMatchObject({
      content_status: "draft",
      published_at: null,
    });

    expect(
      applyEditorialWorkflow({
        collection: { slug: "pages" } as Parameters<typeof applyEditorialWorkflow>[0]["collection"],
        data: {
          content_status: "published",
          title: "Republished page",
        },
        operation: "update",
        originalDoc: {
          content_status: "published",
          published_at: "2026-01-15T08:00:00.000Z",
        },
        req: asWorkflowReq("admin"),
      }),
    ).toMatchObject({
      content_status: "published",
      published_at: "2026-01-15T08:00:00.000Z",
      title: "Republished page",
    });
  });

  it("rejects publishing from non-reviewer roles", () => {
    expect(() =>
      applyEditorialWorkflow({
        collection: { slug: "posts" } as Parameters<typeof applyEditorialWorkflow>[0]["collection"],
        data: {
          content_status: "published",
        },
        operation: "create",
        req: asWorkflowReq("editor"),
      }),
    ).toThrow(ValidationError);
  });

  it("adds the workflow fields, access rules, and hook to pages and posts", () => {
    for (const collection of [Pages, Posts]) {
      expect(collection.access?.create).toBe(editorialContentCreateAccess);
      expect(collection.access?.read).toBe(editorialContentReadAccess);
      expect(collection.hooks?.beforeChange).toEqual([editorialWorkflowBeforeChange]);
      expect(
        collection.fields
          .filter((field) => "name" in field)
          .map((field) => field.name),
      ).toContain("content_status");
      expect(
        collection.fields
          .filter((field) => "name" in field)
          .map((field) => field.name),
      ).toContain("published_at");
    }
  });
});
