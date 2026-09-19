// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import expressiveCode from "satteri-expressive-code";
import satteriCallouts from "satteri-callouts";
import {
  embeddedDirectives,
  embeddedMedia,
} from "./src/plugins/satteri-embedded-media.mjs";

// https://astro.build/config
export default defineConfig({
  // IMPORTANT: Change this to your deployed site URL
  site: "https://linfty.com",

  markdown: {
    syntaxHighlight: false,
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [embeddedDirectives()],
      hastPlugins: [
        expressiveCode({
          themes: ["github-dark", "github-light"],
        }),
        satteriCallouts(),
        embeddedMedia(),
      ],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [mdx(), icon(), sitemap()],

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
      weights: ["300 700"],
    },
  ],
});
