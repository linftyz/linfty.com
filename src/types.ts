export interface HeadProps {
  title: string;
  description: string;
  image?: string;
}

export type ProjectStatusKey =
  | "planning"
  | "in-progress"
  | "completed"
  | "archived";

export type MdiIconName = `mdi:${string}`;
export type LocalSvgAsset = `${string}.svg`;

export interface ToolLogoVariant {
  light?: LocalSvgAsset;
  dark?: LocalSvgAsset;
}

export type ToolLogoSource = LocalSvgAsset | ToolLogoVariant;

export interface ToolItem {
  name: string;
  link?: string;
  icon?: MdiIconName;
  logo?: ToolLogoSource;
}

export interface ToolCategory {
  name: string;
  items: readonly ToolItem[];
}

export interface SiteLabels {
  postsTitle: string;
  postsDescription: string;
  projectsTitle: string;
  projectsDescription: string;
  friendsTitle: string;
  friendsDescription: string;
  toolsTitle: string;
  aboutTitle: string;
  aboutDescription: string;
  categoriesTitle: string;
  categoriesDescription: string;
  tagsTitle: string;
  tagsDescription: string;
  backToPosts: string;
  backToCategories: string;
  backToTags: string;
  goHome: string;
  notFoundTitle: string;
  notFoundDescription: string;
  endOfPost: string;
  tableOfContents: string;
  searchPlaceholder: string;
  searchTrigger: string;
  searchNavigate: string;
  contactTitle: string;
  latestPosts: string;
  viewAllPosts: string;
  noDescription: string;
  noFriends: string;
  noProjects: string;
  postsCountSuffix: string;
  categoriesCountSuffix: string;
  tagsCountSuffix: string;
  categoryPrefix: string;
  tagPrefix: string;
  detailLabel: string;
  updatedPrefix: string;
  notUpdated: string;
  editedSuffix: string;
  wordCount: string;
  viewCount: string;
  commentCount: string;
  newBadge: string;
  draftBadge: string;
  websiteLabel: string;
  sourceLabel: string;
  demoLabel: string;
  commentSuccess: string;
  projectStatus: Record<ProjectStatusKey, string>;
}

export interface SiteConfig {
  meta: {
    title: string;
    description: string;
    author: string;
    logo: string;
    ogImage: string;
    lang: string;
  };
  navigation: readonly {
    name: string;
    subtitle: string;
    href: string;
  }[];
  social: readonly {
    name: string;
    href: string;
    icon: string;
  }[];
  friendCard: {
    name: string;
    description: string;
    link: string;
    avatar: string;
  };
  hero: {
    greeting: string;
    description: string;
    cards: readonly {
      icon: string;
      label: string;
      value: string;
    }[];
  };
  footer: {
    copyright: string;
    builtWith: string;
  };
  comments: {
    enabled: boolean;
    provider: "artalk";
    artalk: {
      server: string;
    };
  };
  features: {
    search: boolean;
    rss: boolean;
    newPostDays: number;
  };
  labels: SiteLabels;
  ogImage: string;
}
