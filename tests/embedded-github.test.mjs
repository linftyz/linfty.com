import assert from "node:assert/strict";
import { test } from "node:test";
import { createRepositoryLoader } from "../src/utils/client/github-repository.mjs";
const response = {
  full_name: "withastro/astro",
  description: "Framework",
  stargazers_count: 100,
  forks_count: 12,
  license: { spdx_id: "MIT" },
};

test("GitHub fetches deduplicate, cache for thirty minutes and survive blocked storage", async () => {
  let calls = 0;
  let time = 0;
  const load = createRepositoryLoader({
    fetcher: async () => {
      calls++;
      return Response.json(response);
    },
    now: () => time,
    storage: () => {
      throw new Error("Blocked");
    },
  });
  const [a, b] = await Promise.all([
    load("withastro/astro"),
    load("withastro/astro"),
  ]);
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
  assert.equal(a.license, "MIT");
  time += 29 * 60 * 1000;
  await load("withastro/astro");
  assert.equal(calls, 1);
  time += 2 * 60 * 1000;
  await load("withastro/astro");
  assert.equal(calls, 2);
});

test("session cache supports page reloads", async () => {
  const values = new Map();
  const storage = () => ({
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  });
  await createRepositoryLoader({
    fetcher: async () => Response.json(response),
    storage,
  })("withastro/astro");
  const load = createRepositoryLoader({
    fetcher: async () => {
      throw new Error("Should not fetch");
    },
    storage,
  });
  assert.equal((await load("withastro/astro")).stars, 100);
});

test("rate limit and malformed responses reject; failed fetch can retry", async () => {
  let calls = 0;
  const load = createRepositoryLoader({
    storage: () => undefined,
    fetcher: async () =>
      ++calls === 1
        ? new Response("", { status: 403 })
        : Response.json(response),
  });
  await assert.rejects(load("withastro/astro"), /403/);
  assert.equal((await load("withastro/astro")).forks, 12);
  await assert.rejects(load("owner/.."), /Invalid repository/);
  await assert.rejects(
    createRepositoryLoader({
      storage: () => undefined,
      fetcher: async () => Response.json({ message: "error" }),
    })("withastro/astro"),
    /Invalid GitHub response/,
  );
});
