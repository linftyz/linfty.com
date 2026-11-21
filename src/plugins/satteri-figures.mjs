import { defineHastPlugin } from "satteri";

const text = (value) => ({ type: "text", value: String(value) });

/** 段落里只有一张图时返回它，图文混排不动 */
const soleImage = (node) => {
  const children = node.children.filter(
    (child) => !(child.type === "text" && !child.value.trim()),
  );
  if (children.length !== 1) return null;
  const [image] = children;
  return image.type === "element" && image.tagName === "img" ? image : null;
};

/** 独占一段的图片包成 figure，alt 当图注；title 留给 hover 提示 */
export function figures() {
  return defineHastPlugin({
    name: "figures",
    element: {
      filter: ["p"],
      visit(node) {
        const image = soleImage(node);
        const caption = image?.properties?.alt;
        if (!image || typeof caption !== "string" || !caption.trim()) return;

        return {
          type: "element",
          tagName: "figure",
          properties: {},
          children: [
            // 正文图多半在折叠线以下，先别下载
            {
              type: "element",
              tagName: "img",
              properties: {
                ...image.properties,
                loading: image.properties.loading || "lazy",
                decoding: image.properties.decoding || "async",
              },
              children: [],
            },
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: [text(caption)],
            },
          ],
        };
      },
    },
  });
}
