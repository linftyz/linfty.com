import { visit } from "unist-util-visit";

const admonitionTypes = {
  note: "NOTE",
  tip: "TIP",
  important: "IMPORTANT",
  warning: "WARNING",
  caution: "CAUTION",
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getText(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";

  return node.children.map((child) => getText(child)).join("");
}

function getDirectiveLabel(node) {
  const labelNode = node.children?.[0];

  if (!labelNode?.data?.directiveLabel) {
    return "";
  }

  node.children.shift();
  return getText(labelNode).trim();
}

function createCalloutTitle(type, title, customTitle) {
  const safeTitle = escapeHtml(title);
  const custom = customTitle ? "true" : "false";

  return `
<div class="md-callout-title" data-callout-custom-title="${custom}">
  <span class="md-callout-icon" aria-hidden="true"></span>
  <span>${safeTitle}</span>
</div>`;
}

function createStepTitle(title) {
  return `<h4 class="md-step-title">${escapeHtml(title)}</h4>`;
}

function transformAdmonition(node, type, title, customTitle = false) {
  node.data ??= {};
  node.data.hName = "aside";
  node.data.hProperties = {
    className: ["md-callout", "not-prose"],
    "data-callout": type,
  };

  node.children.unshift({
    type: "html",
    value: createCalloutTitle(type, title, customTitle),
  });
}

function transformSteps(node) {
  node.data ??= {};
  node.data.hName = "section";
  node.data.hProperties = {
    className: ["md-steps", "not-prose"],
  };
}

function transformStep(node, title) {
  node.data ??= {};
  node.data.hName = "article";
  node.data.hProperties = {
    className: ["md-step"],
  };

  if (title) {
    node.children.unshift({
      type: "html",
      value: createStepTitle(title),
    });
  }
}

export function remarkContainerDirectives() {
  const githubAdmonitionRegex = new RegExp(
    `^\\s*\\[!(${Object.values(admonitionTypes).join("|")})\\]\\s*`,
    "i",
  );

  return (tree) => {
    visit(tree, "containerDirective", (node) => {
      const type = node.name;

      if (type in admonitionTypes) {
        const customTitle = getDirectiveLabel(node);
        transformAdmonition(
          node,
          type,
          customTitle || admonitionTypes[type],
          Boolean(customTitle),
        );
        return;
      }

      if (type === "steps") {
        transformSteps(node);
        return;
      }

      if (type === "step") {
        transformStep(node, getDirectiveLabel(node));
      }
    });

    visit(tree, "blockquote", (node) => {
      const firstParagraph = node.children?.[0];
      const firstTextNode = firstParagraph?.children?.[0];

      if (
        firstParagraph?.type !== "paragraph" ||
        firstTextNode?.type !== "text"
      ) {
        return;
      }

      const match = firstTextNode.value.match(githubAdmonitionRegex);
      if (!match) {
        return;
      }

      const type = match[1].toLowerCase();
      const defaultTitle = admonitionTypes[type];

      if (!defaultTitle) {
        return;
      }

      firstTextNode.value = firstTextNode.value.slice(match[0].length);
      transformAdmonition(node, type, defaultTitle);
    });
  };
}
