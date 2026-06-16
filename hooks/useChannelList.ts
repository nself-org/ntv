/**
 * Purpose: React hook for IPTV channel list management in ɳTV.
 *          Fetches channels from M3U URLs + Xtream sources, caches offline via AsyncStorage,
 *          manages favorites with optimistic updates, and supports search/category filtering.
 * Inputs:  sourceUrl (M3U URL or Xtream credentials stored in AsyncStorage).
 * Outputs: { channels, sections, favorites, search, setSearch, toggleFavorite, loading, error, refresh }
 * Constraints: AsyncStorage for offline cache. No GraphQL client wired yet (stub mutations).
 *              Background sync via expo-background-fetch is registered separately (see registerBackgroundSync).
 * SPORT: F12-REPO-TYPE-MAP.md ntv iptv-data feature
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseM3U } from '../services/m3u-parser';
import type { Channel } from '../services/m3u-parser';
import { xtreamFullSync } from '../services/xtream';
import type { XtreamCredentials } from '../services/xtream';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY_CHANNELS = 'ntv:channels:cache';
const STORAGE_KEY_FAVORITES = 'ntv:channels:favorites';
const STORAGE_KEY_M3U_URLS = 'ntv:m3u:urls';
const STORAGE_KEY_XTREAM_CREDS = 'ntv:xtream:creds';

// Cache TTL: 30 minutes
const CACHE_TTL_MS = 30 * 60 * 1_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChannelSection {
  /** Category / group name — used as SectionList section header */
  title: string;
  data: Channel[];
}

export interface ChannelListState {
  /** Full flat channel list (all sources merged) */
  channels: Channel[];
  /** Channels grouped by category for SectionList display */
  sections: ChannelSection[];
  /** Channel IDs that are favorited */
  favorites: Set<string>;
  /** Current search query string */
  search: string;
  /** Update search filter */
  setSearch: (q: string) => void;
  /** Toggle favorite status for a channel (optimistic update) */
  toggleFavorite: (channelId: string) => void;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Last fetch error, or null */
  error: Error | null;
  /** Force re-fetch from all sources */
  refresh: () => void;
  /** Add a new M3U source URL */
  addM3USource: (url: string) => Promise<void>;
  /** Remove a M3U source URL */
  removeM3USource: (url: string) => Promise<void>;
  /** Currently configured M3U URLs */
  m3uUrls: string[];
  /** Add Xtream credentials */
  addXtreamSource: (creds: XtreamCredentials) => Promise<void>;
  /** Remove Xtream credentials by server URL */
  removeXtreamSource: (server: string) => Promise<void>;
  /** Currently configured Xtream credential list */
  xtreamSources: XtreamCredentials[];
}

interface CachedChannels {
  channels: Channel[];
  cachedAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadCachedChannels(): Promise<Channel[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) return null;
    const parsed: CachedChannels = JSON.parse(raw);
    const age = Date.now() - parsed.cachedAt;
    if (age > CACHE_TTL_MS) return parsed.channels; // Serve stale while revalidating
    return parsed.channels;
  } catch {
    return null;
  }
}

async function saveChannelCache(channels: Channel[]): Promise<void> {
  const payload: CachedChannels = { channels, cachedAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(payload));
}

async function loadFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveFavorites(favorites: Set<string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...favorites]));
}

async function loadM3UUrls(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_M3U_URLS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveM3UUrls(urls: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_M3U_URLS, JSON.stringify(urls));
}

async function loadXtreamCreds(): Promise<XtreamCredentials[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_XTREAM_CREDS);
    return raw ? (JSON.parse(raw) as XtreamCredentials[]) : [];
  } catch {
    return [];
  }
}

async function saveXtreamCreds(creds: XtreamCredentials[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_XTREAM_CREDS, JSON.stringify(creds));
}

async function fetchM3U(url: string): Promise<Channel[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching M3U: ${url}`);
    const text = await response.text();
    const { channels } = parseM3U(text, { sourceUrl: url });
    return channels;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Group a flat channel array into sections by group/category.
 * Favorites section is first if any favorites are present.
 * Ungrouped channels go into an "Other" section.
 */
function buildSections(channels: Channel[], favorites: Set<string>, search: string): ChannelSection[] {
  const q = search.toLowerCase().trim();
  const filtered = q
    ? channels.filter((c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
    : channels;

  const favoriteChannels = filtered.filter((c) => favorites.has(c.id));

  // Group remaining channels by group title
  const groupMap = new Map<string, Channel[]>();
  for (const ch of filtered) {
    const key = ch.group.trim() || 'Other';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(ch);
  }

  const sections: ChannelSection[] = [];

  // Favorites first (if any and not searching)
  if (favoriteChannels.length > 0) {
    sections.push({ title: 'Favorites', data: favoriteChannels });
  }

  // Alphabetically sorted groups
  const sortedGroups = [...groupMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const group of sortedGroups) {
    sections.push({ title: group, data: groupMap.get(group)! });
  }

  return sections;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the IPTV channel list lifecycle:
 * - On mount: loads cached channels immediately (offline-first), then revalidates from sources.
 * - Supports M3U URLs and Xtream Codes credentials as sources.
 * - Favorites persisted to AsyncStorage with optimistic in-state updates.
 * - Search filter applied client-side over merged channel list.
 * - refresh() forces a full re-fetch bypassing cache TTL.
 */
export function useChannelList(): ChannelListState {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [m3uUrls, setM3UUrls] = useState<string[]>([]);
  const [xtreamSources, setXtreamSources] = useState<XtreamCredentials[]>([]);
  const fetchCountRef = useRef(0);

  // Initial load: cache → sources
  useEffect(() => {
    void (async () => {
      // Load config first
      const [urls, creds, favs] = await Promise.all([
        loadM3UUrls(),
        loadXtreamCreds(),
        loadFavorites(),
      ]);
      setM3UUrls(urls);
      setXtreamSources(creds);
      setFavorites(favs);

      // Serve from cache immediately for offline-first UX
      const cached = await loadCachedChannels();
      if (cached && cached.length > 0) {
        setChannels(cached);
      }

      // Fetch fresh data if any sources configured
      if (urls.length > 0 || creds.length > 0) {
        await fetchAll(urls, creds);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = useCallback(async (urls: string[], creds: XtreamCredentials[]) => {
    const fetchId = ++fetchCountRef.current;
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        ...urls.map((url) => fetchM3U(url)),
        ...creds.map((c) => xtreamFullSync(c).then((r) => r.channels)),
      ]);

      if (fetchId !== fetchCountRef.current) return; // Stale fetch — discard

      const merged: Channel[] = [];
      const errs: string[] = [];

      for (const result of results) {
        if (result.status === 'fulfilled') {
          merged.push(...result.value);
        } else {
          errs.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
        }
      }

      // Deduplicate by URL (same channel from multiple sources)
      const seen = new Set<string>();
      const deduped = merged.filter((ch) => {
        if (seen.has(ch.url)) return false;
        seen.add(ch.url);
        return true;
      });

      setChannels(deduped);
      await saveChannelCache(deduped);

      if (errs.length > 0 && deduped.length === 0) {
        setError(new Error(`All sources failed:\n${errs.join('\n')}`));
      } else if (errs.length > 0) {
        // Partial success — don't surface as error, channels loaded
        console.warn('[useChannelList] Some sources failed:', errs);
      }
    } catch (err) {
      if (fetchId === fetchCountRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (fetchId === fetchCountRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchAll(m3uUrls, xtreamSources);
  }, [fetchAll, m3uUrls, xtreamSources]);

  /**
   * Toggle favorite: optimistic update in state + async persist.
   */
  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      // Async persist (fire-and-forget)
      void saveFavorites(next);
      return next;
    });
  }, []);

  const addM3USource = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const next = [...m3uUrls.filter((u) => u !== trimmed), trimmed];
    setM3UUrls(next);
    await saveM3UUrls(next);
    // Immediately fetch from new source
    void fetchAll(next, xtreamSources);
  }, [m3uUrls, xtreamSources, fetchAll]);

  const removeM3USource = useCallback(async (url: string) => {
    const next = m3uUrls.filter((u) => u !== url);
    setM3UUrls(next);
    await saveM3UUrls(next);
    void fetchAll(next, xtreamSources);
  }, [m3uUrls, xtreamSources, fetchAll]);

  const addXtreamSource = useCallback(async (creds: XtreamCredentials) => {
    const next = [
      ...xtreamSources.filter((c) => c.server !== creds.server),
      creds,
    ];
    setXtreamSources(next);
    await saveXtreamCreds(next);
    void fetchAll(m3uUrls, next);
  }, [xtreamSources, m3uUrls, fetchAll]);

  const removeXtreamSource = useCallback(async (server: string) => {
    const next = xtreamSources.filter((c) => c.server !== server);
    setXtreamSources(next);
    await saveXtreamCreds(next);
    void fetchAll(m3uUrls, next);
  }, [xtreamSources, m3uUrls, fetchAll]);

  // Memoize sections to avoid re-grouping on every render
  const sections = useMemo(
    () => buildSections(channels, favorites, search),
    [channels, favorites, search],
  );

  return {
    channels,
    sections,
    favorites,
    search,
    setSearch,
    toggleFavorite,
    loading,
    error,
    refresh,
    addM3USource,
    removeM3USource,
    m3uUrls,
    addXtreamSource,
    removeXtreamSource,
    xtreamSources,
  };
}

// ─── Background Sync ──────────────────────────────────────────────────────────

/**
 * Background task identifier for expo-background-fetch.
 * Register this in app entry point using BackgroundFetch.registerTaskAsync().
 */
export const BACKGROUND_SYNC_TASK = 'ntv-channel-sync';

/**
 * Background sync handler — re-fetches all M3U sources and updates the AsyncStorage cache.
 * Call this from within expo-task-manager defineTask(BACKGROUND_SYNC_TASK, ...) handler.
 *
 * @returns BackgroundFetch.BackgroundFetchResult equivalent: 'new-data' | 'no-data' | 'failed'
 */
export async function runBackgroundChannelSync(): Promise<'new-data' | 'no-data' | 'failed'> {
  try {
    const [urls, creds] = await Promise.all([loadM3UUrls(), loadXtreamCreds()]);

    if (urls.length === 0 && creds.length === 0) {
      return 'no-data';
    }

    const results = await Promise.allSettled([
      ...urls.map((url) => fetchM3U(url)),
      ...creds.map((c) => xtreamFullSync(c).then((r) => r.channels)),
    ]);

    const merged: Channel[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        merged.push(...result.value);
      }
    }

    if (merged.length === 0) {
      return 'failed';
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduped = merged.filter((ch) => {
      if (seen.has(ch.url)) return false;
      seen.add(ch.url);
      return true;
    });

    await saveChannelCache(deduped);
    return 'new-data';
  } catch (err) {
    console.error('[BackgroundSync] Channel sync failed:', err);
    return 'failed';
  }
}
