import assert from "node:assert/strict";
import { readFile, writeFile, unlink, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { htmlToHast } from "satteri";

const root = fileURLToPath(new URL("../", import.meta.url));
const nodes = (node) => [node, ...(node.children || []).flatMap(nodes)];
const hasClass = (node, name) => node.properties?.className?.includes(name);
const normalize = (node) =>
  JSON.parse(
    JSON.stringify(node, (key, value) =>
      key === "position" ? undefined : value,
    ),
  );

async function verify(directory) {
  const pages = await Promise.all(
    ["md", "mdx"].map(async (ext) => {
      const html = await readFile(
        join(directory, `posts/embed-check-${ext}/index.html`),
        "utf8",
      );
      const all = nodes(htmlToHast(html));
      const embeds = all.filter(
        (node) => hasClass(node, "embed-card") || hasClass(node, "embed-video"),
      );
      assert.equal(embeds.length, 4, `${ext}: four embeds`);
      assert.equal(embeds.filter((node) => node.tagName === "a").length, 2);
      assert.equal(all.filter((node) => node.tagName === "iframe").length, 2);
      for (const card of embeds) {
        assert.equal(
          nodes(card).filter(
            (node) =>
              node.tagName === "figure" ||
              node.tagName === "figcaption" ||
              node.properties?.["data-icon"] === "mdi:external-link",
          ).length,
          0,
          `${ext}: no prose wrappers inside embeds`,
        );
      }
      assert(
        all.some(
          (node) =>
            node.properties?.dataCallout === "note" ||
            node.properties?.["data-callout"] === "note",
        ),
      );
      assert(all.some((node) => hasClass(node, "expressive-code")));
      assert(
        all.some(
          (node) =>
            node.tagName === "code" &&
            nodes(node).some(
              (child) =>
                child.type === "text" && child.value.includes("::link"),
            ),
        ),
      );
      if (ext === "mdx") {
        assert(
          all.some(
            (node) =>
              node.tagName === "figcaption" &&
              nodes(node).some((child) => child.value === "Ordinary caption"),
          ),
        );
        assert(
          all.some(
            (node) =>
              node.properties?.["data-icon"] === "mdi:external-link" ||
              node.properties?.dataIcon === "mdi:external-link",
          ),
        );
      }
      return embeds.map(normalize);
    }),
  );
  assert.deepEqual(
    pages[0],
    pages[1],
    "Actual MD/MDX cards and players must match",
  );
  console.log(
    "Actual Astro MD/MDX output matches; ordinary links/images, callouts and code examples pass.",
  );
}

if (process.argv[2] === "--verify") {
  await verify(process.argv[3] || join(root, "dist"));
} else {
  const output = await mkdtemp(join(tmpdir(), "embedded-build-"));
  const created = [];
  try {
    const fixture = await readFile(
      new URL("./fixtures/embedded.md", import.meta.url),
      "utf8",
    );
    for (const ext of ["md", "mdx"]) {
      const path = join(root, `src/content/posts/embed-check-${ext}.${ext}`);
      await writeFile(path, fixture, { flag: "wx" });
      created.push(path);
    }
    const result = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/astro/bin/astro.mjs"),
        "build",
        "--outDir",
        output,
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, "Astro build failed");
    await verify(output);
  } finally {
    await Promise.all(created.map((path) => unlink(path)));
    await rm(output, { recursive: true, force: true });
  }
}
