const site = {
  meta: {
    title: "临风听雨",
    description: "保持好奇，无限进步",
    author: "linfty",
    logo: "/logo.svg",
  },
  navigation: [
    {
      name: "首页",
      englishName: "Index",
      href: "/",
    },
    {
      name: "文章列表",
      englishName: "Writing",
      href: "/posts",
    },
    {
      name: "项目作品",
      englishName: "Projects",
      href: "/projects",
    },
    {
      name: "朋友们",
      englishName: "Friends",
      href: "/friends",
    },
    {
      name: "关于",
      englishName: "About",
      href: "/about",
    },
  ],
  social: [
    {
      name: "GitHub",
      href: "https://github.com/linftyz",
      icon: "mdi:github",
    },
    {
      name: "Email",
      href: "mailto:hi@linfty.com",
      icon: "mdi:email",
    },
  ],
  ogImage: "/og-image.png",
} as const;

export default site;
