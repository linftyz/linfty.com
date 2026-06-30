// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import sitemap from "@astrojs/sitemap";
import remarkDirective from "remark-directive";
import { remarkContainerDirectives } from "./src/utils/remark-container-directives.mjs";
import { unified } from "@astrojs/markdown-remark";

// https://astro.build/config
export default defineConfig({
  // IMPORTANT: Change this to your deployed site URL
  site: "https://linfty.com",

  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkContainerDirectives],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    expressiveCode({
      themes: ["github-dark", "github-light"],
      themeCssSelector: (theme) => `.${theme.type}`,
    }),
    mdx(),
    icon(),
    sitemap(),
  ],

  env: {
    schema: {
      UMAMI_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      UMAMI_WEBSITE_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      PUBLIC_ARTALK_SERVER: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      PUBLIC_ARTALK_ENABLED: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Space Grotesk",
      cssVariable: "--font-display",
    },
  ],
});
