import { routes } from "@/lib/routes";
import type { NavItem, SocialLink } from "@/types/navigation";

export const mainNavigation = [
  {
    label: "首页",
    href: routes.home(),
  },
  {
    label: "文章",
    href: routes.posts(),
  },
  {
    label: "项目",
    href: routes.projects(),
  },
] satisfies NavItem[];

export const footerNavigation = [
  {
    label: "分类",
    href: routes.categories(),
  },
  {
    label: "标签",
    href: routes.tags(),
  },
  {
    label: "友链",
    href: routes.friends(),
  },
  {
    label: "工具",
    href: routes.tools(),
  },
] satisfies NavItem[];

export const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/linftyz",
    icon: "mdi:github",
    handle: "linftyz",
    external: true,
  },
] satisfies SocialLink[];
