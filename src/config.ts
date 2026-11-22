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
    { label: "首页", href: "/" },
    { label: "归档", href: "/archive" },
    { label: "分类", href: "/categories" },
    { label: "标签", href: "/tags" },
    { label: "关于", href: "/about" },
  ],
  date: {
    separator: ".",
  },
};
