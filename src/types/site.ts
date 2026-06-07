export type SeoType = "website" | "article" | "profile";

export interface SeoMeta {
  title?: string;
  description?: string;
  canonical?: string | URL;
  ogImage?: string | URL;
  type?: SeoType;
  noindex?: boolean;
}

export interface SiteAuthor {
  name: string;
  url?: string;
  email?: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  language: string;
  locale: string;
  author: SiteAuthor;
  defaultSeo: SeoMeta & {
    title: string;
    description: string;
    type: SeoType;
  };
}
