import type { APIContext } from "astro";
import { themeConfig } from "@/config";
import { getPosts, getTaxonomies } from "@/lib/posts";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(context: APIContext) {
  const site = String(context.site ?? themeConfig.site.url).replace(/\/$/, "");
  const [posts, { tags }] = await Promise.all([getPosts(), getTaxonomies()]);
  const updated = posts[0]?.data.updated ?? posts[0]?.data.date ?? new Date();

  const entries = posts
    .map((post) => {
      const url = `${site}/posts/${post.id}/`;
      return `  <entry>
    <title>${escape(post.data.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${post.data.date.toISOString()}</published>
    <updated>${(post.data.updated ?? post.data.date).toISOString()}</updated>
    <summary>${escape(post.data.description)}</summary>
${post.data.tags.map((ref) => `    <category term="${escape(tags.get(ref.id)?.data.name ?? ref.id)}"/>`).join("\n")}
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escape(themeConfig.site.title)}</title>
  <subtitle>${escape(themeConfig.site.description)}</subtitle>
  <link href="${site}/atom.xml" rel="self"/>
  <link href="${site}/"/>
  <id>${site}/</id>
  <updated>${updated.toISOString()}</updated>
  <author>
    <name>${escape(themeConfig.site.author)}</name>
  </author>
${entries}
</feed>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
