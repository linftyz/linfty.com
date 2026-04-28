import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const [, , type, ...args] = process.argv;

const now = new Date();
const pad = (value) => String(value).padStart(2, "0");
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function yamlString(value) {
  return JSON.stringify(value);
}

function parseArgs(values) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const [rawKey, inlineValue] = value.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const nextValue = values[index + 1];

    if (inlineValue !== undefined) {
      options[key] = inlineValue;
    } else if (nextValue && !nextValue.startsWith("--")) {
      options[key] = nextValue;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  return { options, positionals };
}

function splitList(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isTruthy(value) {
  return value === true || value === "true" || value === "1" || value === "yes";
}

function writeUniqueFile(relativePath, content) {
  let filePath = join(root, relativePath);
  const extension = ".mdx";
  let suffix = 2;

  while (existsSync(filePath)) {
    filePath = join(
      root,
      relativePath.replace(extension, `-${suffix}${extension}`),
    );
    suffix += 1;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);

  return filePath;
}

function createMemo(values) {
  const { options, positionals } = parseArgs(values);
  const body = positionals.join(" ").trim();
  const tags = splitList(options.tags);
  const slug = slugify(options.slug || body || "memo") || "memo";
  const filename = `${date}-${slug}.mdx`;
  const frontmatter = [
    "---",
    `createdAt: ${date} ${time}`,
    ...(tags.length > 0
      ? ["tags:", ...tags.map((tag) => `  - ${tag}`)]
      : ["tags: []"]),
    ...(isTruthy(options.draft) ? ["draft: true"] : []),
    "---",
    "",
  ];
  const content = `${frontmatter.join("\n")}${body || "写点什么。"}\n`;

  return writeUniqueFile(`src/content/memos/${filename}`, content);
}

function createPost(values) {
  const { options, positionals } = parseArgs(values);
  const title = positionals.join(" ").trim() || "未命名文章";
  const slug = slugify(options.slug || title) || "untitled";
  const filename = `${slug}.mdx`;
  const tags = splitList(options.tags);
  const category = options.category || "uncategorized";
  const summary = options.summary || "";
  const frontmatter = [
    "---",
    `title: ${yamlString(title)}`,
    `createdAt: ${date}`,
    `category: ${yamlString(category)}`,
    ...(tags.length > 0
      ? [`tags: [${tags.map(yamlString).join(", ")}]`]
      : ["tags: []"]),
    `summary: ${yamlString(summary)}`,
    ...(isTruthy(options.publish) ? [] : ["draft: true"]),
    "---",
    "",
  ];
  const content = `${frontmatter.join("\n")}开头写在这里。\n`;

  return writeUniqueFile(`src/content/posts/${filename}`, content);
}

const creators = {
  memo: createMemo,
  post: createPost,
};

if (!creators[type]) {
  console.error(
    [
      "Usage:",
      '  pnpm new:memo "内容" --tags site,memo',
      '  pnpm new:post "文章标题" --slug article-title --category experiments --tags astro,mdx --summary "摘要"',
      '  pnpm new:post "文章标题" --slug my-post --publish',
    ].join("\n"),
  );
  process.exit(1);
}

const filePath = creators[type](args);
console.log(filePath);
