import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

export const getPosts = async () => {
  const posts = await getCollection("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return posts.sort((a, b) => {
    const aDate = new Date(a.data.createdAt).getTime();
    const bDate = new Date(b.data.createdAt).getTime();
    return bDate - aDate;
  });
};

export const getRecentPosts = async (num: number) => {
  return (await getPosts()).slice(0, num);
};

export const getPostNeighbors = async (
  currentPost: PostEntry,
  posts?: PostEntry[],
) => {
  const allPosts = posts ?? (await getPosts());
  const currentIndex = allPosts.findIndex((post) => post.id === currentPost.id);

  return {
    newerPost: currentIndex > 0 ? allPosts[currentIndex - 1] : undefined,
    olderPost:
      currentIndex >= 0 && currentIndex < allPosts.length - 1
        ? allPosts[currentIndex + 1]
        : undefined,
  };
};

export const getRelatedPosts = async (
  currentPost: PostEntry,
  limit = 3,
  posts?: PostEntry[],
) => {
  const allPosts = posts ?? (await getPosts());
  const currentTagIds = new Set(currentPost.data.tags.map((tag) => tag.id));
  const scoredPosts = allPosts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      const sharedTagCount = post.data.tags.filter((tag) =>
        currentTagIds.has(tag.id),
      ).length;
      const sameCategory =
        post.data.category.id === currentPost.data.category.id;

      return {
        post,
        score: (sameCategory ? 4 : 0) + sharedTagCount * 3,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return (
        new Date(b.post.data.createdAt).getTime() -
        new Date(a.post.data.createdAt).getTime()
      );
    });

  const relatedPosts = scoredPosts
    .filter(({ score }) => score > 0)
    .map(({ post }) => post)
    .slice(0, limit);

  if (relatedPosts.length >= limit) {
    return relatedPosts;
  }

  const usedIds = new Set([
    currentPost.id,
    ...relatedPosts.map((post) => post.id),
  ]);
  const fallbackPosts = allPosts
    .filter((post) => !usedIds.has(post.id))
    .slice(0, limit - relatedPosts.length);

  return [...relatedPosts, ...fallbackPosts];
};
