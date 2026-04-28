import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { reference } from "astro:content";
import { defineCollection } from "astro:content";

function slug() {
  return z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Invalid slug");
}

const posts = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/posts",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(128),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      category: reference("categories"),
      tags: z.array(reference("tags")).optional().default([]),
      summary: z.string().optional().default(""),
      cover: image().optional(),
      draft: z.boolean().default(false),
      new: z.boolean().default(false),
    }),
});

const memos = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/memos",
  }),
  schema: z.object({
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    links: z
      .object({
        homepage: z.url().optional(),
        github: z.url().optional(),
        demo: z.url().optional(),
      })
      .optional(),
    status: z
      .enum(["planning", "in-progress", "completed", "archived"])
      .default("completed"),
    image: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: file("./src/content/miscs/categories.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string().max(32),
      slug: slug(),
      description: z
        .string()
        .max(512)
        .optional()
        .default("")
        .describe("In markdown format"),
      icon: z.string().optional().default("mdi:folder"),
    }),
});

const tags = defineCollection({
  loader: file("./src/content/miscs/tags.json"),
  schema: z.object({
    name: z.string().max(32),
    slug: slug(),
    description: z
      .string()
      .max(512)
      .optional()
      .default("")
      .describe("In markdown format"),
  }),
});

const friends = defineCollection({
  loader: file("./src/content/miscs/friends.json"),
  schema: z.object({
    order: z.number().int().nonnegative().optional().default(0),
    name: z.string().max(64),
    description: z.string().optional().describe("One line string"),
    link: z.url(),
    avatar: z.string(),
  }),
});

const tools = defineCollection({
  loader: file("./src/content/miscs/tools.json"),
  schema: z.object({
    name: z.string().max(32),
    slug: slug(),
    order: z.number().int().nonnegative(),
    items: z.array(
      z.object({
        name: z.string().max(64),
        link: z.string().url().optional(),
        icon: z.string().optional(),
        logo: z
          .union([
            z.string(),
            z.object({
              light: z.string().optional(),
              dark: z.string().optional(),
            }),
          ])
          .optional(),
      }),
    ),
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
  memos,
  projects,
  categories,
  tags,
  friends,
  tools,
  pages,
};
