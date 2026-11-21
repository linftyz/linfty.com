import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { themeConfig } from "@/config";
import { getPosts, getTaxonomies } from "@/lib/posts";

export async function GET(context: APIContext) {
  const [posts, { tags }] = await Promise.all([getPosts(), getTaxonomies()]);

  return rss({
    title: themeConfig.site.title,
    description: themeConfig.site.description,
    site: context.site ?? themeConfig.site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: post.data.tags.map(
        (ref) => tags.get(ref.id)?.data.name ?? ref.id,
      ),
    })),
    customData: `<language>${themeConfig.site.lang}</language>`,
  });
}
