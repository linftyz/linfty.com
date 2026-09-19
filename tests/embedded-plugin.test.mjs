import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { markdownToHtml, markdownToJs, mdxToJs } from "satteri";
import {
  embeddedDirectives,
  embeddedMedia,
} from "../src/plugins/satteri-embedded-media.mjs";
const options = (extra = {}) => ({
  features: { directive: true },
  mdastPlugins: [embeddedDirectives()],
  hastPlugins: [
    embeddedMedia({ getMetadata: async () => ({}), warn: () => {}, ...extra }),
  ],
});

test("all four embeds compile equally in MD and MDX", async () => {
  const source = await readFile(
    new URL("./fixtures/embedded.md", import.meta.url),
    "utf8",
  );
  const md = await markdownToJs(source, options());
  const mdx = await mdxToJs(source, options());
  assert.equal(md.code, mdx.code);
  const { html } = await markdownToHtml(source, options());
  assert.equal((html.match(/<iframe /g) || []).length, 2);
  assert.match(html, /data-github-repo="withastro\/astro"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /autoplay=0/);
  assert.match(html, /在 YouTube 打开/);
});

test("invalid parameters warn without generating links or iframes", async () => {
  const sources = [
    '::link{url="javascript:alert(1)"}',
    "::link",
    '::github{repo="owner/.."}',
    '::github{repo="bad.owner/repo"}',
    '::youtube{url="https://evil.test/watch?v=dQw4w9WgXcQ"}',
    '::youtube{url="https://youtu.be/too-short"}',
    '::bilibili{url="https://bilibili.com.evil.test/video/BV1Vm421W7pX"}',
  ];
  for (const source of sources) {
    const warnings = [];
    const opts = options({ warn: (message) => warnings.push(message) });
    const { html } = await markdownToHtml(source, opts);
    assert.match(html, /链接或参数无效/);
    assert.doesNotMatch(html, /<a\b|<iframe/);
    assert.equal(warnings.length, 1);
  }
});

test("manual metadata wins and untrusted text cannot introduce HTML", async () => {
  const { html } = await markdownToHtml(
    '::link{url="https://example.com" title="<script>alert(1)</script>" description="Manual description" image="javascript:alert(1)"}',
    options({
      getMetadata: async () => ({
        title: "Automatic",
        description: "Automatic",
        image: "https://example.com/cover.png",
      }),
    }),
  );
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Manual description/);
  assert.doesNotMatch(html, /<script|<img|javascript:/);
});

test("no cover means no placeholder; fetched metadata is used", async () => {
  const { html } = await markdownToHtml(
    '::link{url="https://example.com"}',
    options({
      getMetadata: async () => ({
        title: "Fetched title",
        description: "Fetched description",
        image: "",
      }),
    }),
  );
  assert.match(html, /Fetched title/);
  assert.doesNotMatch(html, /<img|thumbnail|placeholder/);
});

test("only block directives are converted, including inside blockquotes", async () => {
  const source =
    '> **Nested**\n>\n> ::github{repo="withastro/astro"}\n\n`::github{repo="owner/code"}`\n\n```md\n::link{url="https://example.com"}\n```\n\nInline :github{repo="owner/inline"}';
  const { html } = await markdownToHtml(source, options());
  assert.equal((html.match(/data-github-repo=/g) || []).length, 1);
  assert.match(html, /<blockquote>[\s\S]*embed-github[\s\S]*<\/blockquote>/);
  assert.match(html, /<code[^>]*>::link/);
  assert.match(html, /<strong>Nested<\/strong>/);
});
