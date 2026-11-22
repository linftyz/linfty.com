import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;
export type Category = CollectionEntry<"categories">;
export type Tag = CollectionEntry<"tags">;

const byDateDesc = (a: Post, b: Post) =>
  b.data.date.getTime() - a.data.date.getTime();

const visible = (post: Post) => import.meta.env.DEV || !post.data.draft;

/** 时间倒序，不含草稿 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", visible);
  return posts.sort(byDateDesc);
}

/** 置顶优先，同权重内保持时间序 */
export async function getPostsPinnedFirst(): Promise<Post[]> {
  const posts = await getPosts();
  return posts.sort((a, b) => b.data.pin - a.data.pin);
}

/** slug → 条目，用来把 slug 换成可读名字 */
export async function getTaxonomies() {
  const [categories, tags] = await Promise.all([
    getCollection("categories"),
    getCollection("tags"),
  ]);
  return {
    categories: new Map(categories.map((c) => [c.id, c])),
    tags: new Map(tags.map((t) => [t.id, t])),
  };
}

export function categoryName(
  post: Post,
  categories: Map<string, Category>,
): string | undefined {
  return post.data.category
    ? categories.get(post.data.category.id)?.data.name
    : undefined;
}

/** 剔掉代码、指令、图片和链接地址，只留正文 */
function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^import\s.+$/gm, " ")
    .replace(/^export\s.+$/gm, " ")
    .replace(/::[a-z]+\{[^}]*\}/gi, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[a-z][^>]*>/gi, " ");
}

function textStats(body: string) {
  const text = plainText(body);
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const words = text
    .replace(/[一-鿿]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { cjk, words };
}

export function wordCount(body: string): number {
  const { cjk, words } = textStats(body);
  return cjk + words;
}

/** 中文按字、英文按词，400 字/分钟 */
export function readingTime(body: string): number {
  const { cjk, words } = textStats(body);
  return Math.max(1, Math.round((cjk + words * 1.5) / 400));
}
