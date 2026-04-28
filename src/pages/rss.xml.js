import site from "@/config/site";
import { getMemos } from "@/utils/memo";
import { getPosts } from "@/utils/post";
import rss from "@astrojs/rss";

export async function GET(context) {
  const posts = await getPosts();
  const memos = await getMemos();
  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.createdAt,
      description: post.data.summary,
      link: `/posts/${post.id}`,
    })),
    ...memos.map((memo) => ({
      title: `${site.labels.memosTitle} · ${memo.id}`,
      pubDate: memo.data.createdAt,
      description: memo.body,
      link: `/memos#${memo.id}`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: site.meta.title,
    description: site.meta.description,
    site: context.site,
    items,
  });
}
