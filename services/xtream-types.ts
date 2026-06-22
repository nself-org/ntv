/**
 * Purpose: Public and internal type definitions for the Xtream Codes API client.
 *          Extracted from xtream.ts to keep that file under 300 lines.
 *
 * Inputs:  N/A — type-only module.
 * Outputs: Exported interfaces for credentials, API results, and camelCase mapped types.
 *
 * Constraints:
 *   - No runtime imports; types only.
 *   - Raw* interfaces match the Xtream API snake_case JSON shape exactly.
 *   - Public interfaces use camelCase per TS project conventions.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv xtream-codes-client types
 */

// ─── Public Types ──────────────────────────────────────────────────────────────

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

// ─── Raw API Response Types (snake_case — matches Xtream JSON) ────────────────

export interface RawAuthResponse {
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

export interface RawCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface RawStream {
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

export interface RawEPGResponse {
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
