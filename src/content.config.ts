import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const posts = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/posts",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(128),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).optional().default([]),
      cover: image().optional(),
      draft: z.boolean().default(false),
      pin: z.number().int().min(0).max(99).optional().default(0),
    }),
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/pages",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = {
  posts,
  pages,
};
