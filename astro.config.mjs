// @ts-check
import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import satteriCallouts from "satteri-callouts";
import expressiveCode from "satteri-expressive-code";

import tailwindcss from "@tailwindcss/vite";
import {
  embeddedDirectives,
  embeddedMedia,
} from "./src/plugins/satteri-embedded-media.mjs";
import { figures } from "./src/plugins/satteri-figures.mjs";
import { externalLinks } from "./src/plugins/satteri-external-links.mjs";

const site = "https://linfty.com";

export default defineConfig({
  site,

  integrations: [mdx(), sitemap()],

  env: {
    // 两个都不填就不挂统计；填了才注入
    schema: {
      UMAMI_SRC: envField.string({
        context: "client",
        access: "public",
        url: true,
        optional: true,
      }),
      UMAMI_WEBSITE_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      // Artalk 评论服务端地址。填了才在文章页渲染评论区
      ARTALK_SERVER: envField.string({
        context: "client",
        access: "public",
        url: true,
        optional: true,
      }),
    },
  },

  markdown: {
    // 必须关掉 Shiki：它会把 <pre><code> 拆成 span，expressive-code 就认不出了
    syntaxHighlight: false,

    // directive: true 才能用 ::link{url="…"}
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [embeddedDirectives()],
      hastPlugins: [
        satteriCallouts(),
        embeddedMedia(),
        figures(),
        externalLinks(),
        // 放最末：前面的插件也会产出 pre，先让它们处理完
        expressiveCode({
          themes: ["vitesse-light", "vitesse-dark"],
          // 站的深浅色走 html.dark，不跟系统设置
          useDarkModeMediaQuery: false,
          themeCssSelector: (theme) =>
            theme.type === "dark" ? ".dark" : ":root:not(.dark)",
          styleOverrides: {
            borderRadius: "4px",
            // 跟站内底色统一，否则浅色下会冒出纯白
            codeBackground: "var(--code-bg)",
            borderColor: "var(--border-soft)",
            frames: {
              frameBoxShadowCssValue: "none",
              // 终端块不跟 codeBackground，得单独给
              terminalBackground: "var(--code-bg)",
              // 三点标题栏透明，否则顶部一条白带
              terminalTitlebarBackground: "transparent",
              terminalTitlebarBorderBottomColor: "var(--border-soft)",
            },
            codeFontFamily: "var(--font-mono)",
            codeFontSize: "0.84rem",
            codeLineHeight: "1.75",
            codePaddingBlock: "17px",
            codePaddingInline: "18px",
          },
        }),
      ],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
