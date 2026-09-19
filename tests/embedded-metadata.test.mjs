import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  extractMetadata,
  createMetadataCache,
  isPublicAddress,
  resolvePublicUrl,
} from "../src/plugins/embedded-media/metadata.mjs";
const snapshot = { title: "Cached", description: "Description", image: "" };

test("HTML parsing respects OG priority, entities, relative images and base URLs", () => {
  const result = extractMetadata(
    '<html><head><base href="/assets/"><title>Fallback</title><meta content="A &amp; B" property="og:title"><meta name="description" content="  One   sentence. "><meta property="og:image" content="cover.png"></head></html>',
    "https://example.com/page",
  );
  assert.deepEqual(result, {
    title: "A & B",
    description: "One sentence.",
    image: "https://example.com/assets/cover.png",
  });
  assert.deepEqual(
    extractMetadata(
      "<title>Fallback &amp; title</title>",
      "https://example.com",
    ),
    { title: "Fallback & title", description: "", image: "" },
  );
  assert.equal(
    extractMetadata(
      '<meta property="og:image" content="javascript:alert(1)">',
      "https://example.com",
    ).image,
    "",
  );
});

test("public-address checks reject private, mapped, multicast and reserved addresses", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
    "2001:db8::1",
  ])
    assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])
    assert.equal(isPublicAddress(ip), true, ip);
  await assert.rejects(resolvePublicUrl("http://2130706433"));
  await assert.rejects(
    resolvePublicUrl("http://public.test", async () => [
      { address: "127.0.0.1", family: 4 },
    ]),
  );
  await assert.rejects(resolvePublicUrl("https://user:pass@example.com"));
  const result = await resolvePublicUrl("https://example.com", async () => [
    { address: "1.1.1.1", family: 4 },
  ]);
  assert.equal(result.address.address, "1.1.1.1");
});

test("persistent cache, deduplication, expiry and offline stale fallback", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "embedded-cache-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let calls = 0;
  let time = 1000;
  const get = createMetadataCache({
    directory,
    now: () => time,
    fetcher: async () => {
      calls++;
      return snapshot;
    },
  });
  assert.deepEqual(
    await Promise.all([
      get("https://example.com"),
      get("https://example.com/#section"),
    ]),
    [snapshot, snapshot],
  );
  assert.equal(calls, 1);
  const restored = createMetadataCache({
    directory,
    now: () => time,
    fetcher: async () => {
      throw new Error("Should not fetch");
    },
  });
  assert.deepEqual(await restored("https://example.com"), snapshot);
  time += 8 * 24 * 60 * 60 * 1000;
  const warnings = [];
  const offline = createMetadataCache({
    directory,
    now: () => time,
    fetcher: async () => {
      throw new Error("Offline");
    },
    warn: (message) => warnings.push(message),
  });
  assert.deepEqual(await offline("https://example.com"), snapshot);
  assert.deepEqual(await offline("https://missing.example.com"), {});
  assert.equal(warnings.length, 2);
  await get("https://example.com");
  assert.equal(calls, 2);
  const [file] = await readdir(directory);
  await writeFile(join(directory, file), "broken cache");
  const repaired = createMetadataCache({
    directory,
    fetcher: async () => snapshot,
  });
  assert.deepEqual(await repaired("https://example.com"), snapshot);
});

test("metadata requests are limited to three concurrent fetches", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "embedded-limit-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let active = 0;
  let peak = 0;
  const get = createMetadataCache({
    directory,
    fetcher: async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return snapshot;
    },
  });
  await Promise.all(
    Array.from({ length: 10 }, (_, i) => get(`https://example.com/${i}`)),
  );
  assert.equal(peak, 3);
});
