// @ts-check
/** @typedef {{ description: string, stars: number, forks: number, license: string }} Repository */
const TTL = 30 * 60 * 1000;
/** @param {unknown} value */
const validCount = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** @param {unknown} value @returns {value is Repository} */
function isRepository(value) {
  if (!value || typeof value !== "object") return false;
  return (
    "description" in value &&
    typeof value.description === "string" &&
    "stars" in value &&
    validCount(value.stars) &&
    "forks" in value &&
    validCount(value.forks) &&
    "license" in value &&
    typeof value.license === "string"
  );
}

/** @param {{fetcher?: typeof fetch, now?: () => number, storage?: () => Pick<Storage, "getItem" | "setItem"> | undefined}} [options] */
export function createRepositoryLoader({
  fetcher = globalThis.fetch,
  now = Date.now,
  storage = () => globalThis.sessionStorage,
} = {}) {
  /** @type {Map<string, Promise<Repository>>} */
  const pending = new Map();
  /** @type {Map<string, {expires: number, value: Repository}>} */
  const memory = new Map();
  /** @param {string} repo @returns {Promise<Repository>} */
  return function loadRepository(repo) {
    if (
      !/^[a-z\d][a-z\d-]{0,38}\/[\w.-]+$/i.test(repo) ||
      [".", ".."].includes(repo.split("/")[1])
    )
      return Promise.reject(new Error("Invalid repository"));
    const key = `embedded-github:v1:${repo.toLowerCase()}`;
    const cached = memory.get(key);
    if (cached && cached.expires > now()) return Promise.resolve(cached.value);
    try {
      const saved = JSON.parse(storage()?.getItem(key) || "null");
      if (saved?.expires > now() && isRepository(saved.value)) {
        memory.set(key, saved);
        return Promise.resolve(saved.value);
      }
    } catch {
      /* Storage may be unavailable or contain stale data. */
    }
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    const request = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetcher(`https://api.github.com/repos/${repo}`, {
          signal: controller.signal,
          credentials: "omit",
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
        const data = await response.json();
        if (
          typeof data?.full_name !== "string" ||
          !validCount(data.stargazers_count) ||
          !validCount(data.forks_count)
        )
          throw new Error("Invalid GitHub response");
        const spdx = data.license?.spdx_id;
        const license =
          typeof spdx === "string" && spdx !== "NOASSERTION"
            ? spdx
            : typeof data.license?.name === "string"
              ? data.license.name
              : "未声明许可证";
        const value = {
          description:
            typeof data.description === "string" ? data.description : "",
          stars: data.stargazers_count,
          forks: data.forks_count,
          license,
        };
        const record = { value, expires: now() + TTL };
        memory.set(key, record);
        try {
          storage()?.setItem(key, JSON.stringify(record));
        } catch {
          /* Memory cache remains usable. */
        }
        return value;
      } finally {
        clearTimeout(timeout);
      }
    })().finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
