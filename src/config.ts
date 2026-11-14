import type { ThemeConfig } from "./types/config";

export const themeConfig: ThemeConfig = {
  site: {
    url: "https://linfty.com",
    title: "临风听雨",
    description: "保持好奇，无限进步",
    author: "宇风",
    lang: "zh-CN",
    github: "https://github.com/linftyz",
  },
  nav: [
    { label: "首页", href: "/", icon: "home" },
    { label: "归档", href: "/archive", icon: "archive" },
    { label: "标签", href: "/tags", icon: "tag" },
    { label: "关于", href: "/about", icon: "user" },
  ],
  date: {
    format: "YYYY-MM-DD",
    separator: ".",
  },
  umami: {
    src: "https://um.linfty.com/script.js",
    websiteId: "cf5cbe5a-3e4e-44b2-9786-6c6e30498ffa",
  },
};
