export interface NavItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

export interface SocialLink extends NavItem {
  icon: string;
  handle?: string;
}
