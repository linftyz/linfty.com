import { defineMdastPlugin, defineHastPlugin } from "satteri";
import { createMetadataCache } from "./embedded-media/metadata.mjs";

export function httpUrl(value, base) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(String(value), base);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

const text = (value) => ({ type: "text", value: String(value) });
const element = (tagName, properties = {}, children = []) => ({
  type: "element",
  tagName,
  properties,
  children,
});
const span = (className, value) =>
  element("span", { className: [className] }, [text(value)]);
const link = (href, properties, children) =>
  element(
    "a",
    {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-embedded-media": "",
      ...properties,
    },
    children,
  );

const kinds = new Set(["link", "github", "youtube", "bilibili"]);
const paths = {
  github:
    "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z",
  star: "m12 3 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.34l-5.62 2.96 1.07-6.27L2.9 9.6l6.3-.9L12 3Z",
  fork: "M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 7v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7m-6 5v5",
  license: "M8 3h8l4 4v14H4V3h4Zm6 0v6h6M8 13h8m-8 4h6",
};
function icon(name) {
  return element(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: name === "github" ? 22 : 15,
      height: name === "github" ? 22 : 15,
      fill: name === "github" ? "currentColor" : "none",
      stroke: name === "github" ? "none" : "currentColor",
      strokeWidth: 1.5,
      "aria-hidden": "true",
    },
    [element("path", { d: paths[name] })],
  );
}

function githubCard(props) {
  const repo = String(props.repo || "").trim();
  if (!/^[a-z\d](?:[a-z\d-]{0,38})\/[\w.-]+$/i.test(repo)) return null;
  const [owner, name] = repo.split("/");
  if ([".", ".."].includes(name)) return null;
  const stat = (key, label) =>
    element("span", { className: ["embed-stat"] }, [
      icon(key),
      element("span", { [`data-github-${key}`]: "" }, [text(`${label} —`)]),
    ]);
  return link(
    `https://github.com/${repo}`,
    {
      className: ["not-prose", "embed-card", "embed-github"],
      "data-github-repo": repo,
    },
    [
      element("span", { className: ["embed-github-heading"] }, [
        element("img", {
          src: `https://github.com/${owner}.png?size=64`,
          alt: "",
          width: 28,
          height: 28,
          loading: "lazy",
          decoding: "async",
          className: ["embed-avatar"],
          "data-embedded-media": "",
        }),
        element("span", { className: ["embed-repo"] }, [
          text(`${owner} / `),
          element("strong", {}, [text(name)]),
        ]),
        icon("github"),
      ]),
      element(
        "span",
        { className: ["embed-description"], "data-github-description": "" },
        [text(props.description || "查看项目源码、文档与最新进展。")],
      ),
      element("span", { className: ["embed-stats"] }, [
        stat("star", "Stars"),
        stat("fork", "Forks"),
        stat("license", "License"),
      ]),
      element(
        "span",
        { className: ["embed-status"], "data-github-status": "", hidden: true },
        [],
      ),
    ],
  );
}

function video(props, kind) {
  const url = httpUrl(props.url);
  if (!url || url.port) return null;
  const host = url.hostname.replace(/^www\./, "");
  let id;
  if (kind === "youtube") {
    if (host === "youtu.be") id = url.pathname.slice(1).replace(/\/$/, "");
    if (["youtube.com", "m.youtube.com"].includes(host))
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)\/?$/)?.[1];
    if (!/^[\w-]{11}$/.test(id || "")) return null;
  } else {
    if (host === "bilibili.com")
      id = url.pathname.match(/^\/video\/(BV[a-z\d]+)\/?$/i)?.[1];
    if (!id) return null;
  }
  const title = kind === "youtube" ? "YouTube" : "Bilibili";
  return element("div", { className: ["not-prose", "embed-video"] }, [
    element("iframe", {
      src:
        kind === "youtube"
          ? `https://www.youtube.com/embed/${id}`
          : `https://player.bilibili.com/player.html?bvid=${id}&autoplay=0`,
      title: `${title} 视频播放器`,
      loading: "lazy",
      allowFullScreen: true,
      allow: "encrypted-media; fullscreen; picture-in-picture",
    }),
    link(url.href, { className: ["embed-video-source"] }, [
      text(`在 ${title} 打开 ↗`),
    ]),
  ]);
}

function linkCard(props, metadata = {}) {
  const url = httpUrl(props.url);
  if (!url) return null;
  const title = props.title || metadata.title || url.hostname;
  const description = props.description || metadata.description;
  const image = httpUrl(props.image || metadata.image, url);
  return link(
    url.href,
    { className: ["not-prose", "embed-card", "embed-link"] },
    [
      element("span", { className: ["embed-content"] }, [
        span("embed-source", url.hostname.replace(/^www\./, "")),
        span("embed-title", title),
        ...(description ? [span("embed-description", description)] : []),
      ]),
      ...(image
        ? [
            element("img", {
              src: image.href,
              alt: "",
              width: 80,
              height: 80,
              className: ["embed-thumbnail"],
              loading: "lazy",
              decoding: "async",
              "data-embedded-media": "",
            }),
          ]
        : []),
    ],
  );
}

export function embeddedDirectives() {
  return defineMdastPlugin({
    name: "embedded-directives",
    leafDirective(node) {
      if (!kinds.has(node.name)) return;
      const props = {};
      for (const key of ["url", "title", "description", "image", "repo"]) {
        if (typeof node.attributes?.[key] === "string")
          props[key] = node.attributes[key];
      }
      return {
        ...node,
        data: {
          hName: "div",
          hProperties: { ...props, "data-embed-directive": node.name },
        },
      };
    },
  });
}

export function embeddedMedia({
  getMetadata = createMetadataCache(),
  warn = console.warn,
} = {}) {
  return defineHastPlugin({
    name: "embedded-media",
    element: {
      filter: [],
      async visit(node, ctx) {
        const props = node.properties || {};
        const kind = props["data-embed-directive"];
        if (!kinds.has(kind)) return;
        let result;
        if (kind === "link") {
          const url = httpUrl(props.url);
          if (url)
            result = linkCard(
              props,
              props.title && props.description && props.image
                ? {}
                : await getMetadata(url.href),
            );
        } else if (kind === "github") result = githubCard(props);
        else result = video(props, kind);
        if (result) return result;
        const message = `[embed:${kind}] 链接或参数无效`;
        ctx.report({ node, severity: "warning", message });
        warn(`${ctx.fileURL?.pathname || "Markdown"}: ${message}`);
        return element("p", { className: ["embed-invalid"] }, [text(message)]);
      },
    },
  });
}
