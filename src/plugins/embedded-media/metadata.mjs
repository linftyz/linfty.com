import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { readFile, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import { join } from "node:path";
import { htmlToHast } from "satteri";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const MAX_BYTES = 1024 * 1024;
const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
])
  blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
]) {
  blocked.addSubnet(address, prefix, "ipv6");
}

export function isPublicAddress(address) {
  const family = isIP(address);
  return family === 4
    ? !blocked.check(address, "ipv4")
    : family === 6 &&
        globalV6.check(address, "ipv6") &&
        !blocked.check(address, "ipv6");
}

export async function resolvePublicUrl(value, resolve = lookup) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Unsupported URL");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await resolve(hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  )
    throw new Error("Non-public address");
  return { url, address: addresses[0] };
}

function readResponse(url, address, signal) {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        signal,
        agent: false,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
          "user-agent": "LinftyLinkCard/1.0",
        },
        // Pin the validated address, so a second DNS lookup cannot reach a private host.
        lookup(_hostname, options, callback) {
          if (options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
      },
      async (response) => {
        try {
          const status = response.statusCode || 0;
          if ([301, 302, 303, 307, 308].includes(status)) {
            response.destroy();
            if (!response.headers.location)
              throw new Error("Missing redirect location");
            resolve({ redirect: new URL(response.headers.location, url).href });
            return;
          }
          const contentType = response.headers["content-type"] || "";
          if (
            status < 200 ||
            status >= 300 ||
            !/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)
          ) {
            response.destroy();
            throw new Error(`Not an HTML response (${status})`);
          }
          if (Number(response.headers["content-length"]) > MAX_BYTES) {
            response.destroy();
            throw new Error("Response too large");
          }
          const chunks = [];
          let size = 0;
          for await (const chunk of response) {
            size += chunk.length;
            if (size > MAX_BYTES) {
              response.destroy();
              throw new Error("Response too large");
            }
            chunks.push(chunk);
          }
          const charset =
            contentType.match(/charset=["']?([^;\s"']+)/i)?.[1] || "utf-8";
          resolve({
            html: new TextDecoder(charset).decode(Buffer.concat(chunks)),
          });
        } catch (error) {
          reject(error);
        }
      },
    );
    request.on("error", reject);
    request.end();
  });
}

export async function fetchMetadata(value) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Metadata timeout"));
    }, 5000);
  });
  const work = async () => {
    let target = value;
    for (let redirects = 0; redirects <= 3; redirects++) {
      const { url, address } = await resolvePublicUrl(target);
      controller.signal.throwIfAborted();
      const result = await readResponse(url, address, controller.signal);
      if (result.redirect) {
        target = result.redirect;
        continue;
      }
      return extractMetadata(result.html, url.href);
    }
    throw new Error("Too many redirects");
  };
  try {
    return await Promise.race([work(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const clean = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
export function extractMetadata(html, baseUrl) {
  const meta = new Map();
  let title = "";
  let documentBase = baseUrl;
  const content = (node) =>
    node.type === "text"
      ? node.value
      : (node.children || []).map(content).join("");
  function visit(node) {
    if (node.tagName === "title" && !title) title = clean(content(node));
    if (
      node.tagName === "base" &&
      node.properties?.href &&
      documentBase === baseUrl
    ) {
      try {
        documentBase = new URL(node.properties.href, baseUrl).href;
      } catch {
        /* Ignore malformed base URLs. */
      }
    }
    if (node.tagName === "meta") {
      const props = node.properties || {};
      const key = clean(props.property || props.name).toLowerCase();
      if (key && !meta.has(key)) meta.set(key, clean(props.content));
    }
    for (const child of node.children || []) visit(child);
  }
  visit(htmlToHast(html));
  let image = "";
  const source = meta.get("og:image") || meta.get("twitter:image");
  if (source) {
    try {
      const url = new URL(source, documentBase);
      if (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      )
        image = url.href;
    } catch {
      /* Keep a text-only card if the image URL is invalid. */
    }
  }
  return {
    title: (meta.get("og:title") || meta.get("twitter:title") || title).slice(
      0,
      300,
    ),
    description: (
      meta.get("og:description") ||
      meta.get("twitter:description") ||
      meta.get("description") ||
      ""
    ).slice(0, 1000),
    image,
  };
}

export function createMetadataCache({
  directory = new URL("../../../.cache/embedded-media/", import.meta.url),
  fetcher = fetchMetadata,
  now = Date.now,
  warn = console.warn,
} = {}) {
  const pending = new Map();
  const recent = new Map();
  const queue = [];
  let active = 0;
  async function limitedFetch(url) {
    if (active >= 3) await new Promise((resolve) => queue.push(resolve));
    else active++;
    try {
      return await fetcher(url);
    } finally {
      const next = queue.shift();
      if (next) next();
      else active--;
    }
  }
  return function getMetadata(value) {
    const url = new URL(value);
    url.hash = "";
    const key = url.href;
    const memory = recent.get(key);
    if (memory && memory.expires > now())
      return Promise.resolve(memory.metadata);
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      const filename = `${createHash("sha256").update(key).digest("hex")}.json`;
      const path =
        directory instanceof URL
          ? new URL(filename, directory)
          : join(directory, filename);
      let cached;
      try {
        const data = JSON.parse(await readFile(path, "utf8"));
        if (
          data.version === 1 &&
          data.url === key &&
          Number.isFinite(data.fetchedAt) &&
          ["title", "description", "image"].every(
            (field) => typeof data.metadata?.[field] === "string",
          )
        )
          cached = data;
      } catch {
        /* A missing or damaged cache is fetched again. */
      }
      if (cached && now() - cached.fetchedAt < WEEK) {
        recent.set(key, {
          metadata: cached.metadata,
          expires: cached.fetchedAt + WEEK,
        });
        return cached.metadata;
      }
      let metadata;
      try {
        metadata = await limitedFetch(key);
      } catch (error) {
        warn(
          `[embedded-media] ${url.hostname}: ${error.message}; using cached or fallback information`,
        );
        metadata = cached?.metadata || {};
        recent.set(key, { metadata, expires: now() + 60000 });
        return metadata;
      }
      const fetchedAt = now();
      recent.set(key, { metadata, expires: fetchedAt + WEEK });
      const temporary =
        directory instanceof URL
          ? new URL(`${filename}.${randomUUID()}.tmp`, directory)
          : `${path}.${randomUUID()}.tmp`;
      try {
        await mkdir(directory, { recursive: true });
        await writeFile(
          temporary,
          JSON.stringify({ version: 1, url: key, fetchedAt, metadata }),
          "utf8",
        );
        await rename(temporary, path);
      } catch (error) {
        warn(
          `[embedded-media] Cannot write metadata cache: ${error.code || error.message}`,
        );
      } finally {
        await unlink(temporary).catch(() => {});
      }
      return metadata;
    })().finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}
