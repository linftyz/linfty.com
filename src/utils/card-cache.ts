export interface StorageCacheEntry<T> {
  expiresAt: number;
  data: T;
}

export interface RequestMemoryCache<T> {
  values: Map<string, T | null>;
  pending: Map<string, Promise<T | null>>;
}

export function createRequestMemoryCache<T>(): RequestMemoryCache<T> {
  return {
    values: new Map<string, T | null>(),
    pending: new Map<string, Promise<T | null>>(),
  };
}

export function hasResolvedValue<T>(
  cache: RequestMemoryCache<T>,
  key: string,
): boolean {
  return cache.values.has(key);
}

export function readResolvedValue<T>(
  cache: RequestMemoryCache<T>,
  key: string,
): T | null | undefined {
  return cache.values.get(key);
}

export function readPendingRequest<T>(
  cache: RequestMemoryCache<T>,
  key: string,
): Promise<T | null> | undefined {
  return cache.pending.get(key);
}

export function writeResolvedValue<T>(
  cache: RequestMemoryCache<T>,
  key: string,
  value: T | null,
): T | null {
  cache.values.set(key, value);
  return value;
}

export function trackPendingRequest<T>(
  cache: RequestMemoryCache<T>,
  key: string,
  request: Promise<T | null>,
): Promise<T | null> {
  const trackedRequest = request.finally(() => {
    cache.pending.delete(key);
  });

  cache.pending.set(key, trackedRequest);
  return trackedRequest;
}

function getStorageKey(namespace: string, key: string): string {
  return `linfty:${namespace}:${key}`;
}

export function clearSessionStorageCache(namespace: string, key: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(getStorageKey(namespace, key));
  } catch {}
}

export function readSessionStorageCache<T>(
  namespace: string,
  key: string,
): T | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(getStorageKey(namespace, key));
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as StorageCacheEntry<T>;
    if (!cached.expiresAt || cached.expiresAt < Date.now()) {
      clearSessionStorageCache(namespace, key);
      return null;
    }

    return cached.data;
  } catch {
    clearSessionStorageCache(namespace, key);
    return null;
  }
}

export function writeSessionStorageCache<T>(
  namespace: string,
  key: string,
  data: T,
  ttlMs: number,
): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    const entry: StorageCacheEntry<T> = {
      expiresAt: Date.now() + ttlMs,
      data,
    };

    sessionStorage.setItem(
      getStorageKey(namespace, key),
      JSON.stringify(entry),
    );
  } catch {}
}
