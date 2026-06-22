/**
 * Purpose: Background sync handler for the ɳTV channel list — re-fetches all sources
 *          and updates the AsyncStorage cache. Extracted from useChannelList.ts.
 *
 * Inputs:  Reads M3U URLs + Xtream creds from AsyncStorage / SecureStore via channelListStorage.
 * Outputs: 'new-data' | 'no-data' | 'failed' (expo-background-fetch result enum equivalents).
 *
 * Constraints:
 *   - No React hooks — pure async function usable from expo-task-manager defineTask.
 *   - Xtream credentials read from SecureStore via loadXtreamCreds (never AsyncStorage).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv iptv-data feature
 */

import type { Channel } from '../services/m3u-parser';
import { xtreamFullSync } from '../services/xtream';
import {
  fetchM3U,
  loadM3UUrls,
  loadXtreamCreds,
  saveChannelCache,
} from './channelListStorage';

/**
 * Background task identifier for expo-background-fetch.
 * Register this in app entry point using BackgroundFetch.registerTaskAsync().
 */
export const BACKGROUND_SYNC_TASK = 'ntv-channel-sync';

/**
 * Background sync handler — re-fetches all M3U sources and updates the AsyncStorage cache.
 * Call this from within expo-task-manager defineTask(BACKGROUND_SYNC_TASK, ...) handler.
 *
 * @returns 'new-data' | 'no-data' | 'failed'
 */
export async function runBackgroundChannelSync(): Promise<'new-data' | 'no-data' | 'failed'> {
  try {
    const [urls, creds] = await Promise.all([loadM3UUrls(), loadXtreamCreds()]);
    if (urls.length === 0 && creds.length === 0) return 'no-data';

    const results = await Promise.allSettled([
      ...urls.map((url) => fetchM3U(url)),
      ...creds.map((c) => xtreamFullSync(c).then((r) => r.channels)),
    ]);

    const merged: Channel[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') merged.push(...result.value);
    }
    if (merged.length === 0) return 'failed';

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
