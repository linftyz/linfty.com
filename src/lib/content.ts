import { getCollection, getEntry, type CollectionEntry } from "astro:content";

function byCreatedAtDesc(
  a: CollectionEntry<"posts">,
  b: CollectionEntry<"posts">,
) {
  return b.data.createdAt.getTime() - a.data.createdAt.getTime();
}

function byOrderThenName<
  T extends
    | CollectionEntry<"categories">
    | CollectionEntry<"friends">
    | CollectionEntry<"tools">,
>(a: T, b: T) {
  return (
    a.data.order - b.data.order ||
    a.data.name.localeCompare(b.data.name, "zh-CN")
  );
}

function byName<T extends CollectionEntry<"tags">>(a: T, b: T) {
  return a.data.name.localeCompare(b.data.name, "zh-CN");
}

function countByReference(
  posts: CollectionEntry<"posts">[],
  field: "category",
) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const id = post.data[field].id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

function countByReferences(posts: CollectionEntry<"posts">[], field: "tags") {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const reference of post.data[field]) {
      counts.set(reference.id, (counts.get(reference.id) ?? 0) + 1);
    }
  }

  return counts;
}

export async function getPublishedPosts() {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return [...posts].sort(byCreatedAtDesc);
}

export async function getPostBySlug(slug: string) {
  const post = await getEntry("posts", slug);

  if (!post || post.data.draft) {
    return undefined;
  }

  return post;
}

export async function getPostsByCategory(slug: string) {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.category.id === slug);
}

export async function getPostsByTag(slug: string) {
  const posts = await getPublishedPosts();
  return posts.filter((post) =>
    post.data.tags.some((reference) => reference.id === slug),
  );
}

export async function getCategoriesWithCount() {
  const [categories, posts] = await Promise.all([
    getCollection("categories"),
    getPublishedPosts(),
  ]);
  const counts = countByReference(posts, "category");

  return [...categories]
    .sort(byOrderThenName)
    .map((entry) => ({ entry, count: counts.get(entry.id) ?? 0 }));
}

export async function getTagsWithCount() {
  const [tags, posts] = await Promise.all([
    getCollection("tags"),
    getPublishedPosts(),
  ]);
  const counts = countByReferences(posts, "tags");

  return [...tags]
    .sort(byName)
    .map((entry) => ({ entry, count: counts.get(entry.id) ?? 0 }));
}

export async function getProjects() {
  const projects = await getCollection("projects");
  return [...projects].sort((a, b) =>
    a.data.title.localeCompare(b.data.title, "zh-CN"),
  );
}

export async function getFriends() {
  const friends = await getCollection("friends");
  return [...friends].sort(byOrderThenName);
}

export async function getTools() {
  const tools = await getCollection("tools");
  return [...tools].sort(byOrderThenName);
}
