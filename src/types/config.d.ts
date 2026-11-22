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

export interface NavItem {
  label: string;
  href: string;
}

export interface DateConfig {
  separator: string;
}

export interface ThemeConfig {
  site: SiteInfo;
  nav: NavItem[];
  date: DateConfig;
}
