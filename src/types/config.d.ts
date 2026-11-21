export interface SiteInfo {
  url: string;
  title: string;
  description: string;
  author: string;
  lang: string;
  github: string;
  /** 形如 "@handle"，留空则不输出 twitter:site */
  twitter?: string;
}

export type NavIcon = "home" | "archive" | "folder" | "tag" | "user";

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

export interface ThemeConfig {
  site: SiteInfo;
  nav: NavItem[];
  date: DateConfig;
}
