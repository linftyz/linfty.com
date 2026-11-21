import type { APIContext } from "astro";
import { themeConfig } from "@/config";

export function GET(context: APIContext) {
  const site = String(context.site ?? themeConfig.site.url).replace(/\/$/, "");

  const body = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
