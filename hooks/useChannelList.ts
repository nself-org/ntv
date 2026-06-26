/**
 * Purpose: React hook for IPTV channel list management in ɳTV.
 *          Fetches channels from M3U URLs + Xtream sources, caches offline via AsyncStorage,
 *          manages favorites with optimistic updates, and supports search/category filtering.
 *          buildSections extracted to buildChannelSections.ts; background sync to channelBackgroundSync.ts.
 *
 * Inputs:  sourceUrl (M3U URL or Xtream credentials stored in AsyncStorage).
 * Outputs: { channels, sections, favorites, search, setSearch, toggleFavorite, loading, error, refresh }
 *
 * Constraints: AsyncStorage for non-sensitive offline cache only. Xtream credentials
 *              (username/password) are sensitive and MUST be kept in expo-secure-store
 *              (Keychain/Keystore), per the Security-Always-Free doctrine and
 *              .claude/docs/security/secrets-handling-checklist.md — never AsyncStorage.
 *              No GraphQL client wired yet (stub mutations).
 *              Background sync via expo-background-fetch: see channelBackgroundSync.ts.
 *              Storage/fetch helpers extracted to channelListStorage.ts (≤50-line rule).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv iptv-data feature
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Channel } from '../services/m3u-parser';
import { xtreamFullSync } from '../services/xtream';
import type { XtreamCredentials } from '../services/xtream';
import {
  loadCachedChannels,
  saveChannelCache,
  loadFavorites,
  saveFavorites,
  loadM3UUrls,
  saveM3UUrls,
  loadXtreamCreds,
  saveXtreamCreds,
  fetchM3U,
} from './channelListStorage';
import { buildSections, type ChannelSection } from './buildChannelSections';

// Re-export ChannelSection so consumers can import from this module as before.
export type { ChannelSection } from './buildChannelSections';

// ─── Types ────────────────────────────────────────────────────────────────────

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

  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
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
    void fetchAll(next, xtreamSources);
  }, [m3uUrls, xtreamSources, fetchAll]);

  const removeM3USource = useCallback(async (url: string) => {
    const next = m3uUrls.filter((u) => u !== url);
    setM3UUrls(next);
    await saveM3UUrls(next);
    void fetchAll(next, xtreamSources);
  }, [m3uUrls, xtreamSources, fetchAll]);

  const addXtreamSource = useCallback(async (creds: XtreamCredentials) => {
    const next = [...xtreamSources.filter((c) => c.server !== creds.server), creds];
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

// Re-export background sync so consumers that previously imported from this module continue to work.
export { BACKGROUND_SYNC_TASK, runBackgroundChannelSync } from './channelBackgroundSync';
