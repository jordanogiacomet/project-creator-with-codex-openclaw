import type { CollectionConfig } from "payload";

import {
  createEditorialWorkflowFields,
  editorialContentCreateAccess,
  editorialContentReadAccess,
  editorialContentUpdateAccess,
  editorialWorkflowBeforeChange,
} from "../lib/content-status";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    defaultColumns: ["title", "slug", "content_status", "published_at", "updatedAt"],
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
      name: "hero",
      type: "relationship",
      maxDepth: 1,
      relationTo: "media",
    },
    {
      name: "body_or_blocks",
      label: "Body or Blocks",
      type: "richText",
    },
    {
      name: "seo_title",
      type: "text",
    },
    {
      name: "seo_description",
      type: "textarea",
    },
  ],
  hooks: {
    beforeChange: [editorialWorkflowBeforeChange],
  },
};
