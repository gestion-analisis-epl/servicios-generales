const CACHE_PREFIX = 'oa-cache:';

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

export async function fetchJsonCached<T>(url: string, ttlMs: number): Promise<T> {
  const cacheKey = CACHE_PREFIX + url;
  const cached = readCache(cacheKey);
  if (cached) return cached as T;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();

  writeCache(cacheKey, data, ttlMs);
  return data;
}

function readCache(key: string): unknown | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: unknown, ttlMs: number): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry = { expiresAt: Date.now() + ttlMs, data };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena); no es crítico para el funcionamiento.
  }
}
