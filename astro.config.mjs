// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://linfty.com",

  // 不带末尾斜杠
  trailingSlash: "never",

  // 磁盘产出 x.html 而不是 x/index.html，让文件形态和 URL 策略一致
  build: {
    format: "file",
  },

  integrations: [mdx()],

  vite: {
    plugins: [tailwindcss()],
  },
});
