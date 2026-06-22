/**
 * Purpose: Pure helpers for the Xtream Codes API client — base64 decode, URL builder,
 *          JSON fetch with timeout, and snake_case→camelCase mapping functions.
 *          Extracted from xtream.ts to keep that file under 300 lines.
 *
 * Inputs:  XtreamCredentials, raw API response objects (RawAuthResponse etc.)
 * Outputs: Decoded strings, built URLs, mapped camelCase types, fetched JSON.
 *
 * Constraints:
 *   - decodeBase64Utf8 must NOT use Node's Buffer (unavailable under Hermes/RN Expo).
 *   - fetchJSON uses AbortController for timeout; no global timer leaks.
 *   - No UI imports; pure data-transformation + network only.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv xtream-codes-client helpers
 */

import type { Channel } from './m3u-parser';
import type {
  RawAuthResponse,
  RawCategory,
  RawStream,
  XtreamAuthResult,
  XtreamCategory,
  XtreamCredentials,
} from './xtream-types';

// ─── Hermes-safe base64 decode ──────────────────────────────────────────────────
// Xtream EPG titles/descriptions arrive base64-encoded. Node's `Buffer` is NOT
// available under Hermes (the RN/Expo JS engine), so `Buffer.from(s,'base64')`
// throws a ReferenceError at runtime. This pure-TS decoder works on every engine.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decode a base64 string to UTF-8 text without relying on Node's Buffer.
 * Returns an empty string for empty/whitespace-only input; tolerates missing
 * padding and ignores characters outside the base64 alphabet.
 */
export function decodeBase64Utf8(input: string): string {
  const str = (input ?? '').replace(/[^A-Za-z0-9+/=]/g, '');
  if (str.length === 0) return '';

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '=') break;
    const val = B64_CHARS.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  // Decode the raw byte sequence as UTF-8.
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      const b1 = bytes[i++] ?? 0;
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      const b3 = bytes[i++] ?? 0;
      const cp =
        ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      const off = cp - 0x10000;
      result += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
    }
  }
  return result;
}

// ─── Network helpers ──────────────────────────────────────────────────────────

export const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Build the base Xtream player_api.php URL with auth params.
 */
export function buildApiUrl(creds: XtreamCredentials, params: Record<string, string>): string {
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
export async function fetchJSON<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
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

// ─── Mapping helpers ──────────────────────────────────────────────────────────

export function mapAuthResponse(raw: RawAuthResponse): XtreamAuthResult {
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

export function mapCategory(raw: RawCategory): XtreamCategory {
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
export function mapStreamToChannel(raw: RawStream, creds: XtreamCredentials): Channel {
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
