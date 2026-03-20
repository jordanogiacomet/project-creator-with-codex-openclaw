import type { GlobalConfig } from "payload";

export const Homepage: GlobalConfig = {
  slug: "homepage",
  fields: [
    {
      name: "hero",
      type: "group",
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "media",
          type: "relationship",
          maxDepth: 1,
          relationTo: "media",
        },
      ],
    },
    {
      name: "featured_posts",
      type: "relationship",
      hasMany: true,
      maxDepth: 1,
      relationTo: "posts",
    },
    {
      name: "featured_pages",
      type: "relationship",
      hasMany: true,
      maxDepth: 1,
      relationTo: "pages",
    },
    {
      name: "seo",
      type: "group",
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "description",
          type: "textarea",
        },
      ],
    },
  ],
};
