import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";

const slug = () =>
  z
    .string()
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能是小写字母、数字和连字符");

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().max(128),
    description: z.string().min(1).max(240),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: reference("categories").optional(),
    tags: z.array(reference("tags")).default([]),
    cover: z
      .string()
      .refine(
        (v) => v.startsWith("/") || /^https?:\/\//.test(v),
        "cover 必须是站内绝对路径（/cover/x.webp）或 http(s) URL",
      )
      .optional(),
    /** 只影响首页顺序，大的在前 */
    pin: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const categories = defineCollection({
  loader: file("./src/content/miscs/categories.json"),
  schema: z.object({
    name: z.string().max(32),
    slug: slug(),
    description: z.string().max(512).default(""),
    icon: z.string().default("mdi:folder"),
  }),
});

const tags = defineCollection({
  loader: file("./src/content/miscs/tags.json"),
  schema: z.object({
    name: z.string().max(32),
    slug: slug(),
    description: z.string().max(512).default(""),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { posts, categories, tags, pages };
