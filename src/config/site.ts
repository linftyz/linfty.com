import type { SiteConfig } from "@/types/site";

export const siteConfig = {
  name: "linfty.com",
  description: "我的个人网站",
  url: "https://linfty.com",
  language: "zh-CN",
  locale: "zh_CN",
  author: {
    name: "linfty",
    url: "https://linfty.com",
  },
  defaultSeo: {
    title: "linfty.com",
    description: "我的个人网站",
    type: "website",
    ogImage: "/favicon.svg",
  },
} satisfies SiteConfig;
