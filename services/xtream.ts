/**
 * Purpose: XTREAM Codes API client for ɳTV — authenticates, fetches categories, live streams, and EPG.
 *          Types extracted to xtream-types.ts; helpers/mappers to xtream-helpers.ts.
 *
 * Inputs:  XtreamCredentials (server, username, password) + optional category/stream filters.
 * Outputs: XtreamCategory[], Channel[] (mapped from XtreamStream), XtreamEPGResult.
 *
 * Constraints:
 *   - Uses standard fetch (React Native compatible). Rate-limit friendly (no polling).
 *   - Xtream EPG base64 decoded via Hermes-safe pure-TS decoder in xtream-helpers.ts.
 *   - Xtream credentials stored only in expo-secure-store (never AsyncStorage).
 *
 * SPORT: F12-REPO-TYPE-MAP.md ntv iptv-data feature
 */

import type { Channel } from './m3u-parser';
import type {
  RawAuthResponse,
  RawCategory,
  RawEPGResponse,
  RawStream,
  XtreamAuthResult,
  XtreamCategory,
  XtreamCredentials,
  XtreamEPGResult,
} from './xtream-types';
import {
  buildApiUrl,
  decodeBase64Utf8,
  fetchJSON,
  mapAuthResponse,
  mapCategory,
  mapStreamToChannel,
} from './xtream-helpers';

// Re-export all public types for consumers that import from this module.
export type {
  XtreamAuthResult,
  XtreamCategory,
  XtreamCredentials,
  XtreamEPGEntry,
  XtreamEPGResult,
  XtreamServerInfo,
  XtreamStream,
  XtreamUserInfo,
} from './xtream-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const XTREAM_ACTION_AUTHENTICATE = 'authenticate';
const XTREAM_ACTION_GET_LIVE_CATEGORIES = 'get_live_categories';
const XTREAM_ACTION_GET_LIVE_STREAMS = 'get_live_streams';
const XTREAM_ACTION_GET_SHORT_EPG = 'get_short_epg';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Authenticate against an Xtream Codes API server.
 * Validates credentials and retrieves server + user metadata.
 *
 * @throws Error if credentials are invalid or server is unreachable
 */
export async function xtreamAuthenticate(creds: XtreamCredentials): Promise<XtreamAuthResult> {
  const url = buildApiUrl(creds, { action: XTREAM_ACTION_AUTHENTICATE });
  const raw = await fetchJSON<RawAuthResponse>(url);
  if (!raw.user_info || !raw.server_info) {
    throw new Error('Invalid Xtream server response: missing user_info or server_info');
  }
  // Xtream servers return status in varying casing ("Active", "active", "ACTIVE").
  if ((raw.user_info.status ?? '').toLowerCase() !== 'active') {
    throw new Error(`Xtream account not active — status: ${raw.user_info.status}`);
  }
  return mapAuthResponse(raw);
}

/**
 * Fetch all live stream categories from an authenticated Xtream server.
 */
export async function xtreamGetLiveCategories(creds: XtreamCredentials): Promise<XtreamCategory[]> {
  const url = buildApiUrl(creds, { action: XTREAM_ACTION_GET_LIVE_CATEGORIES });
  const raw = await fetchJSON<RawCategory[]>(url);
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected response format for live categories');
  }
  return raw.map(mapCategory);
}

/**
 * Fetch all live streams, optionally filtered by category ID.
 * Returns channels mapped to the canonical Channel type.
 *
 * @param creds       Xtream credentials
 * @param categoryId  Optional category filter (Xtream category_id string)
 */
export async function xtreamGetLiveStreams(
  creds: XtreamCredentials,
  categoryId?: string,
): Promise<Channel[]> {
  const params: Record<string, string> = { action: XTREAM_ACTION_GET_LIVE_STREAMS };
  if (categoryId) {
    params['category_id'] = categoryId;
  }
  const url = buildApiUrl(creds, params);
  const raw = await fetchJSON<RawStream[]>(url);
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected response format for live streams');
  }
  return raw.map((s) => mapStreamToChannel(s, creds));
}

/**
 * Fetch short EPG (current + next program) for a given stream ID.
 * Returns parsed EPG entries with base64-decoded titles and descriptions.
 *
 * @param creds     Xtream credentials
 * @param streamId  Xtream stream_id integer
 * @param limit     Max number of EPG entries to return (default: 2 for current+next)
 */
export async function xtreamGetShortEPG(
  creds: XtreamCredentials,
  streamId: number,
  limit = 2,
): Promise<XtreamEPGResult> {
  const url = buildApiUrl(creds, {
    action: XTREAM_ACTION_GET_SHORT_EPG,
    stream_id: String(streamId),
    limit: String(limit),
  });
  const raw = await fetchJSON<RawEPGResponse>(url);
  return {
    epgListings: (raw.epg_listings ?? []).map((e) => ({
      id: e.id,
      epgId: e.epg_id,
      title: decodeBase64Utf8(e.title),
      lang: e.lang,
      start: e.start,
      end: e.end,
      description: decodeBase64Utf8(e.description ?? ''),
      channelId: e.channel_id,
      startTimestamp: e.start_timestamp,
      stopTimestamp: e.stop_timestamp,
      nowPlaying: e.now_playing,
      hasArchive: e.has_archive,
    })),
  };
}

/**
 * Convenience: authenticate + fetch categories + all live streams in one call.
 * Returns { authResult, categories, channels }.
 *
 * @throws on auth failure or network error
 */
export async function xtreamFullSync(creds: XtreamCredentials): Promise<{
  authResult: XtreamAuthResult;
  categories: XtreamCategory[];
  channels: Channel[];
}> {
  const authResult = await xtreamAuthenticate(creds);
  const [categories, channels] = await Promise.all([
    xtreamGetLiveCategories(creds),
    xtreamGetLiveStreams(creds),
  ]);
  return { authResult, categories, channels };
}

/**
 * Build a direct M3U playlist URL for an Xtream server (bulk export).
 * Some players prefer importing the full M3U over the API.
 */
export function xtreamBuildM3UUrl(creds: XtreamCredentials): string {
  const base = creds.server.replace(/\/$/, '');
  return `${base}/get.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&type=m3u_plus&output=ts`;
}
