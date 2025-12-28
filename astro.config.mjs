// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://linfty.com",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    expressiveCode({
      themeCssSelector: (theme) => `.${theme.type}`,
      themes: ["github-dark", "github-light"],
    }),
    mdx(),
    icon(),
    sitemap(),
  ],

  experimental: {
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: "Space Grotesk",
        cssVariable: "--font-display",
      },
    ],
  },
});
