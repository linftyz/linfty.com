import { PUBLIC_ARTALK_ENABLED, PUBLIC_ARTALK_SERVER } from "astro:env/server";
import type { SiteConfig } from "@/types";

const artalkServer = PUBLIC_ARTALK_SERVER?.trim() || "";
const artalkEnabled =
  PUBLIC_ARTALK_ENABLED === undefined
    ? Boolean(artalkServer)
    : PUBLIC_ARTALK_ENABLED;

const site = {
  // --- Site Metadata ---
  meta: {
    title: "临风听雨",
    description: "保持好奇，无限进步",
    author: "宇风",
    logo: "/logo.svg",
    ogImage: "/og-image.png",
    lang: "zh-CN",
  },

  // --- Navigation ---
  // subtitle: decorative label shown below the name (uppercase, small text)
  navigation: [
    { name: "首页", subtitle: "Index", href: "/" },
    { name: "文章列表", subtitle: "Blog", href: "/posts" },
    { name: "随记", subtitle: "Memos", href: "/memos" },
    { name: "项目作品", subtitle: "Projects", href: "/projects" },
    { name: "朋友们", subtitle: "Friends", href: "/friends" },
    { name: "关于", subtitle: "About", href: "/about" },
  ],

  // --- Social Links ---
  social: [
    { name: "GitHub", href: "https://github.com/linftyz", icon: "mdi:github" },
    { name: "邮箱", href: "mailto:hi@linfty.com", icon: "mdi:email" },
  ],

  friendCard: {
    name: "临风听雨",
    description: "保持好奇，无限进步",
    link: "https://linfty.com",
    avatar: "https://linfty.com/logo.svg",
  },

  // --- Homepage Hero ---
  hero: {
    greeting: "👋 你好，我是宇风",
    // Supports HTML. Use <span class="font-medium text-foreground underline decoration-primary/30"> to highlight keywords
    description: `
      <p class="text-lg leading-relaxed font-light text-muted-foreground">
      一名热爱探索新技术的业余全栈开发者。我会在这里分享关于 <span
        class="font-medium text-foreground underline decoration-primary/30"
        >开发经验</span
      >、<span class="font-medium text-foreground underline decoration-primary/30"
        >折腾笔记</span
      > 以及 <span
        class="font-medium text-foreground underline decoration-primary/30"
        >数字生活</span
      > 的思考。
    </p>
    `,
    cards: [
      { icon: "mdi:explore", label: "状态", value: "做一些有趣的东西" },
      { icon: "mdi:location", label: "坐标", value: "中国 · 西安" },
    ],
  },

  // --- Footer ---
  footer: {
    copyright: "© 2025 临风听雨",
    builtWith: "基于 Astro 构建",
  },

  // --- Comments ---
  comments: {
    enabled: artalkEnabled,
    provider: "artalk" as const,
    artalk: {
      server: artalkServer,
    },
  },

  // --- Feature Toggles ---
  features: {
    search: true,
    rss: true,
    // Auto-mark posts as "new" if published within this many days (0 to disable)
    newPostDays: 7,
  },

  // --- UI Labels ---
  // Customize these values to change the text displayed on pages
  labels: {
    postsTitle: "文章",
    postsDescription: "记录笔记、思考，以及一些技术探索",
    memosTitle: "随记",
    memosDescription: "一些不够成文，但值得留下的小想法。",
    projectsTitle: "项目",
    projectsDescription: "一些为兴趣而做，也为解决实际问题而生的小作品。",
    friendsTitle: "朋友们",
    friendsDescription: "散落在网络各处的有趣灵魂。",
    toolsTitle: "工具箱",
    toolsDescription: "记录我日常比较常用的一些工具与工作环境。",
    aboutTitle: "关于",
    aboutDescription: "关于这个网站，以及写下这些内容的我",
    categoriesTitle: "分类",
    categoriesDescription: "浏览所有分类",
    tagsTitle: "标签",
    tagsDescription: "浏览所有标签",
    backToPosts: "返回文章列表",
    postNavigation: "文章导航",
    newerPost: "较新一篇",
    olderPost: "较早一篇",
    relatedPosts: "延伸阅读",
    backToCategories: "返回分类页",
    backToTags: "返回标签页",
    goHome: "回到首页",
    notFoundTitle: "页面未找到",
    notFoundDescription: "你访问的页面可能已被移除，或者链接已经失效。",
    endOfPost: "正文结束",
    tableOfContents: "目录",
    searchPlaceholder: "搜索文章、标签或命令...",
    searchTrigger: "搜索",
    searchNavigate: "快速访问",
    rssTitle: "RSS",
    rssDescription: "订阅最新文章",
    contactTitle: "联系我",
    latestPosts: "最新文章",
    latestMemos: "最近随记",
    viewAllPosts: "查看全部",
    viewAllMemos: "查看全部",
    noMemos: "还没有随记。",
    memoPermalink: "直达链接",
    memoExternalLink: "相关链接",
    noDescription: "暂无描述",
    noFriends: "还没有友链。",
    noProjects: "还没有项目。",
    postsCountSuffix: "篇文章",
    categoriesCountSuffix: "个分类",
    tagsCountSuffix: "个标签",
    categoryPrefix: "分类：",
    tagPrefix: "标签：",
    detailLabel: "正文",
    updatedPrefix: "更新于 ",
    notUpdated: "尚未更新",
    editedSuffix: "（已编辑）",
    wordCount: "字数",
    viewCount: "阅读",
    commentCount: "评论",
    newBadge: "新",
    draftBadge: "草稿",
    websiteLabel: "网站",
    sourceLabel: "源码",
    demoLabel: "演示",
    commentSuccess: "评论提交成功",
    projectStatus: {
      planning: "规划中",
      "in-progress": "进行中",
      completed: "已完成",
      archived: "已归档",
    },
  },

  ogImage: "/og-image.png",
} as const satisfies SiteConfig;

export default site;
