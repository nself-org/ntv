/**
 * Purpose: Input validators for ɳTV user-facing forms.
 *
 * Inputs:  raw string values from M3U URL field, torrent URL field
 * Outputs: ValidationResult with ok/error shape (no Zod dep — pure TS)
 *
 * Constraints:
 *   - No external validation library (Zod not in ntv deps). Pure TS.
 *   - M3U URL: must be http:// or https://, non-empty host, non-empty path.
 *   - Torrent URL: must start with magnet: OR http:// or https:// pointing to .torrent.
 *   - All validators return a Result-compatible shape { ok, error? }.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv input-validation feature
 */

// ---------------------------------------------------------------------------
// ValidationResult
// ---------------------------------------------------------------------------

export interface ValidationOk {
  ok: true;
}

export interface ValidationErr {
  ok: false;
  /** User-facing error message. */
  message: string;
}

export type ValidationResult = ValidationOk | ValidationErr;

// ---------------------------------------------------------------------------
// M3U URL validator
// ---------------------------------------------------------------------------

const M3U_SCHEME_RE = /^https?:\/\//i;
const M3U_EXT_RE = /\.(m3u8?|ts|txt|php|aspx)(\?|$)/i;

/**
 * Validate an M3U playlist URL entered by the user.
 *
 * Rules:
 * 1. Non-empty.
 * 2. Starts with http:// or https://.
 * 3. URL is parseable by the URL constructor.
 * 4. Hostname is non-empty.
 *
 * Note: We do NOT require a .m3u extension — many providers serve playlists
 * from generic API endpoints (e.g. /get.php?username=…&type=m3u_plus).
 */
export function validateM3UUrl(raw: string): ValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, message: 'Playlist URL is required.' };
  }

  if (!M3U_SCHEME_RE.test(trimmed)) {
    return {
      ok: false,
      message: 'Playlist URL must start with http:// or https://.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, message: 'Playlist URL is not a valid URL.' };
  }

  if (!parsed.hostname) {
    return { ok: false, message: 'Playlist URL must include a hostname.' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Torrent URL validator
// ---------------------------------------------------------------------------

const TORRENT_HTTP_RE = /^https?:\/\//i;
const MAGNET_RE = /^magnet:\?xt=urn:btih:[a-f0-9]{40,}/i;

/**
 * Validate a torrent URL or magnet link entered by the user.
 *
 * Rules:
 * 1. Non-empty.
 * 2. Starts with magnet:?xt=urn:btih: (with at least 40 hex chars of infohash)
 *    OR starts with http(s):// and ends with .torrent.
 */
export function validateTorrentUrl(raw: string): ValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, message: 'Torrent URL or magnet link is required.' };
  }

  // Accept magnet links
  if (trimmed.toLowerCase().startsWith('magnet:')) {
    if (MAGNET_RE.test(trimmed)) {
      return { ok: true };
    }
    return {
      ok: false,
      message:
        'Invalid magnet link. Expected format: magnet:?xt=urn:btih:<infohash>',
    };
  }

  // Accept http(s) .torrent URLs
  if (TORRENT_HTTP_RE.test(trimmed)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { ok: false, message: 'Torrent URL is not a valid URL.' };
    }
    const path = parsed.pathname.toLowerCase();
    if (!path.endsWith('.torrent')) {
      return {
        ok: false,
        message: 'HTTP torrent URL must end with .torrent',
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    message:
      'Enter a magnet link (magnet:?xt=…) or a .torrent URL (https://…)',
  };
}
