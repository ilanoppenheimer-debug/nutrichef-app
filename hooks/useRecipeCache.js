import { readStoredJson, writeStoredJson } from '../lib/gemini.js';

/**
 * TTL-based localStorage cache for recipe generation results.
 *
 * Storage format:
 *   { [key]: { data: any, timestamp: number } }
 *
 * Usage:
 *   const { getCached, setCache, clearAll } = useRecipeCache();
 *   const hit = getCached(key);        // null if missing or expired
 *   setCache(key, data);               // saves with current timestamp
 */

const STORAGE_KEY = 'nutrichef_cooking_cache_v2';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export function useRecipeCache(ttlMs = DEFAULT_TTL_MS) {
  /**
   * Returns cached data for `key` if it exists and is not expired.
   * Removes the entry and returns null if expired.
   */
  const getCached = (key) => {
    const store = readStoredJson(STORAGE_KEY, {});
    const entry = store[key];
    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttlMs) {
      // Expired — remove and return null
      const updated = { ...store };
      delete updated[key];
      writeStoredJson(STORAGE_KEY, updated);
      return null;
    }

    return entry.data;
  };

  /**
   * Persists data under `key` with the current timestamp.
   * Also prunes all other expired entries (keeps the store lean).
   */
  const setCache = (key, data) => {
    const store = readStoredJson(STORAGE_KEY, {});

    // Remove expired entries while we're here
    const now = Date.now();
    const pruned = Object.fromEntries(
      Object.entries(store).filter(([, v]) => now - v.timestamp <= ttlMs)
    );

    pruned[key] = { data, timestamp: now };
    writeStoredJson(STORAGE_KEY, pruned);
  };

  /** Wipes the entire cooking cache (useful for debug / settings page). */
  const clearAll = () => writeStoredJson(STORAGE_KEY, {});

  return { getCached, setCache, clearAll };
}
