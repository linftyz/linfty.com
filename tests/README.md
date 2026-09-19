# 嵌入内容验证

- `pnpm test:embeds`：插件输出、URL 校验、网页元数据解析和缓存、GitHub 数据加载与失败处理。
- `pnpm test:embeds:build`：临时将同一 fixture 放入 Markdown 和 MDX 内容集合，构建到系统临时目录，比较实际 Astro 页面输出；无论成功失败都会删除测试文章和临时构建。
- `pnpm build`：正常生产构建。展示页为 `/posts/embedded-content/`。

浏览器检查：桌面和 375px、深浅主题；滚动到 GitHub 卡片后获取统计；切换到其他文章再返回时不重复请求；阻断 GitHub API 时保留简介和链接；普通链接、图片、图注、Callout 与代码示例正常。

网页元数据位于 `.cache/embedded-media/`，有效期七天，失效抓取失败时保留旧值。该目录不提交；CI 可缓存此目录以复用元数据。手动 `title` / `description` / `image` 优先；字段齐全时跳过抓取。
