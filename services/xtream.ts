/**
 * Purpose: XTREAM Codes API client for ɳTV — authenticates, fetches categories, live streams, and EPG.
 * Inputs:  XtreamCredentials (server, username, password) + optional category/stream filters.
 * Outputs: XtreamCategory[], Channel[] (mapped from XtreamStream), XtreamEPG.
 * Constraints: Uses standard fetch (React Native compatible). Rate-limit friendly (no polling).
 * SPORT: F12-REPO-TYPE-MAP.md ntv iptv-data feature
 */

import type { Channel } from './m3u-parser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XtreamCredentials {
  /** Full server URL including scheme, e.g. "http://example.com:8080" */
  server: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  status: string;
  expDate: string | null;
  maxConnections: string;
  activeConnections: string;
  isTrial: '0' | '1';
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  httpsPort: string;
  serverProtocol: 'http' | 'https';
  rtmpPort: string;
  timezone: string;
  timestampNow: number;
  timeNow: string;
}

export interface XtreamAuthResult {
  userInfo: XtreamUserInfo;
  serverInfo: XtreamServerInfo;
}

export interface XtreamCategory {
  categoryId: string;
  categoryName: string;
  parentId: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  streamType: string;
  streamId: number;
  streamIcon: string;
  epgChannelId: string;
  added: string;
  categoryId: string;
  customSid: string;
  tvArchive: number;
  directSource: string;
  tvArchiveDuration: number;
}

export interface XtreamEPGEntry {
  id: string;
  epgId: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channelId: string;
  startTimestamp: number;
  stopTimestamp: number;
  nowPlaying: number;
  hasArchive: number;
}

export interface XtreamEPGResult {
  epgListings: XtreamEPGEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const XTREAM_ACTION_AUTHENTICATE = 'authenticate';
const XTREAM_ACTION_GET_LIVE_CATEGORIES = 'get_live_categories';
const XTREAM_ACTION_GET_LIVE_STREAMS = 'get_live_streams';
const XTREAM_ACTION_GET_SHORT_EPG = 'get_short_epg';
const XTREAM_ACTION_GET_SIMPLE_DATA_TABLE = 'get_simple_data_table';

const DEFAULT_TIMEOUT_MS = 15_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the base Xtream player_api.php URL with auth params.
 */
function buildApiUrl(creds: XtreamCredentials, params: Record<string, string>): string {
  const base = creds.server.replace(/\/$/, '');
  const qs = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    ...params,
  });
  return `${base}/player_api.php?${qs.toString()}`;
}

/**
 * Fetch JSON from a URL with timeout. Throws on HTTP error or timeout.
 */
async function fetchJSON<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Raw API Response Types ───────────────────────────────────────────────────

interface RawAuthResponse {
  user_info: {
    username: string;
    status: string;
    exp_date: string | null;
    max_connections: string;
    active_connections: string;
    is_trial: '0' | '1';
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: 'http' | 'https';
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
  };
}

interface RawCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

interface RawStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

interface RawEPGResponse {
  epg_listings: Array<{
    id: string;
    epg_id: string;
    title: string;
    lang: string;
    start: string;
    end: string;
    description: string;
    channel_id: string;
    start_timestamp: number;
    stop_timestamp: number;
    now_playing: number;
    has_archive: number;
  }>;
}

// ─── Mapping Helpers ──────────────────────────────────────────────────────────

function mapAuthResponse(raw: RawAuthResponse): XtreamAuthResult {
  return {
    userInfo: {
      username: raw.user_info.username,
      status: raw.user_info.status,
      expDate: raw.user_info.exp_date,
      maxConnections: raw.user_info.max_connections,
      activeConnections: raw.user_info.active_connections,
      isTrial: raw.user_info.is_trial,
    },
    serverInfo: {
      url: raw.server_info.url,
      port: raw.server_info.port,
      httpsPort: raw.server_info.https_port,
      serverProtocol: raw.server_info.server_protocol,
      rtmpPort: raw.server_info.rtmp_port,
      timezone: raw.server_info.timezone,
      timestampNow: raw.server_info.timestamp_now,
      timeNow: raw.server_info.time_now,
    },
  };
}

function mapCategory(raw: RawCategory): XtreamCategory {
  return {
    categoryId: raw.category_id,
    categoryName: raw.category_name,
    parentId: raw.parent_id,
  };
}

/**
 * Map a raw Xtream stream to the canonical Channel type.
 * Builds a direct HLS stream URL from server/username/password/streamId.
 */
function mapStreamToChannel(
  raw: RawStream,
  creds: XtreamCredentials,
): Channel {
  const base = creds.server.replace(/\/$/, '');
  const url = `${base}/live/${creds.username}/${creds.password}/${raw.stream_id}.m3u8`;

  return {
    id: raw.epg_channel_id?.trim() !== '' ? raw.epg_channel_id : `xtream-${raw.stream_id}`,
    name: raw.name,
    url,
    logoUrl: raw.stream_icon ?? '',
    group: raw.category_id,
    tvgId: raw.epg_channel_id ?? '',
    tvgName: raw.name,
    sourceUrl: creds.server,
  };
}

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
  if (raw.user_info.status !== 'Active') {
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
 * Returns parsed EPG entries.
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
      title: Buffer.from(e.title, 'base64').toString('utf-8'),
      lang: e.lang,
      start: e.start,
      end: e.end,
      description: Buffer.from(e.description ?? '', 'base64').toString('utf-8'),
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
