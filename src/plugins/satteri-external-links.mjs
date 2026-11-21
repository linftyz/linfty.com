import { defineHastPlugin } from "satteri";

const text = (value) => ({ type: "text", value: String(value) });

const arrow = () => ({
  type: "element",
  tagName: "svg",
  properties: {
    className: ["inline-block", "ml-[2px]"],
    xmlns: "http://www.w3.org/2000/svg",
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  },
  children: [
    {
      type: "element",
      tagName: "path",
      properties: {
        fill: "currentColor",
        d: "M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm11-3v8h-2V6.413l-7.793 7.794l-1.414-1.414L17.585 5H13V3z",
      },
      children: [],
    },
  ],
});

const isExternal = (href) =>
  typeof href === "string" && /^https?:\/\//i.test(href);

/** 外链补 target/rel 并加箭头，内链原样返回 */
export function externalLinks() {
  return defineHastPlugin({
    name: "external-links",
    element: {
      filter: ["a"],
      visit(node) {
        const props = node.properties || {};
        if (props["data-embedded-media"] !== undefined) return;
        if (!isExternal(props.href)) return;

        return {
          ...node,
          properties: {
            ...props,
            target: "_blank",
            rel: "noopener noreferrer",
          },
          children: [...node.children, arrow()],
        };
      },
    },
  });
}
