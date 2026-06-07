import type { RoutePath, RouteSlug } from "@/types/routes";

function segment(slug: RouteSlug) {
  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    throw new Error("Route slug cannot be empty.");
  }

  return encodeURIComponent(normalized);
}

export const routes = {
  home: (): RoutePath => "/",
  posts: (): RoutePath => "/posts/",
  post: (slug: RouteSlug): RoutePath => `/posts/${segment(slug)}/`,
  categories: (): RoutePath => "/categories/",
  category: (slug: RouteSlug): RoutePath => `/categories/${segment(slug)}/`,
  tags: (): RoutePath => "/tags/",
  tag: (slug: RouteSlug): RoutePath => `/tags/${segment(slug)}/`,
  projects: (): RoutePath => "/projects/",
  project: (slug: RouteSlug): RoutePath => `/projects/${segment(slug)}/`,
  friends: (): RoutePath => "/friends/",
  tools: (): RoutePath => "/tools/",
};
