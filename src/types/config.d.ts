export interface SiteInfo {
  url: string;
  title: string;
  description: string;
  author: string;
  lang: string;
  github: string;
}

export type NavIcon = "home" | "archive" | "tag" | "user";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

export interface DateConfig {
  format:
    | "YYYY-MM-DD"
    | "MM-DD-YYYY"
    | "DD-MM-YYYY"
    | "MONTH DAY YYYY"
    | "DAY MONTH YYYY";
  separator: string;
}

export interface UmamiConfig {
  src: string;
  websiteId: string;
}

export interface ThemeConfig {
  site: SiteInfo;
  nav: NavItem[];
  date: DateConfig;
  umami?: UmamiConfig;
}
