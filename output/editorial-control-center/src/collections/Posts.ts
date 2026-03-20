import type { CollectionConfig } from "payload";

import {
  createEditorialWorkflowFields,
  editorialContentCreateAccess,
  editorialContentReadAccess,
  editorialContentUpdateAccess,
  editorialWorkflowBeforeChange,
} from "../lib/content-status";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    defaultColumns: ["title", "slug", "author", "content_status", "published_at", "updatedAt"],
    useAsTitle: "title",
  },
  access: {
    create: editorialContentCreateAccess,
    read: editorialContentReadAccess,
    update: editorialContentUpdateAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    ...createEditorialWorkflowFields(),
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "body",
      type: "richText",
    },
    {
      name: "author",
      type: "relationship",
      maxDepth: 1,
      relationTo: "authors",
      required: true,
    },
    {
      name: "featured_image",
      type: "relationship",
      maxDepth: 1,
      relationTo: "media",
    },
  ],
  hooks: {
    beforeChange: [editorialWorkflowBeforeChange],
  },
};
