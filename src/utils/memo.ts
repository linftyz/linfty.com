import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type MemoEntry = CollectionEntry<"memos">;

export const getMemos = async () => {
  const memos = await getCollection("memos", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return memos.sort((a, b) => {
    const aDate = new Date(a.data.createdAt).getTime();
    const bDate = new Date(b.data.createdAt).getTime();
    return bDate - aDate;
  });
};

export const getRecentMemos = async (num: number) => {
  return (await getMemos()).slice(0, num);
};
