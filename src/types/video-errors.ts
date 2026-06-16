/**
 * Purpose: Typed VideoError discriminated union and Result<T,E> for ɳTV.
 *
 * Inputs:  error type string (one of 6 variants)
 * Outputs: VideoError union, VideoErrorMessages map, Result<T,E> generic
 *
 * Constraints:
 *   - All 6 error variants must have user-readable messages.
 *   - bundle_required is the only variant that should trigger an upsell flow.
 *   - drm_error is treated as non-retryable; all others have a retry path.
 *   - Result<T,E> is a lightweight discriminated union (no external deps).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv typed-errors feature
 */

// ---------------------------------------------------------------------------
// VideoError
// ---------------------------------------------------------------------------

/** All possible error types for ɳTV playback and data operations. */
export type VideoErrorType =
  | 'stream_unavailable'
  | 'm3u_parse_failed'
  | 'network'
  | 'bundle_required'
  | 'auth'
  | 'drm_error';

/** Discriminated union for ɳTV video / data errors. */
export type VideoError =
  | {
      type: 'stream_unavailable';
      /** Human-readable reason from the player, if available. */
      reason?: string;
    }
  | {
      type: 'm3u_parse_failed';
      /** The offending playlist URL. */
      sourceUrl?: string;
      /** Parser-level detail (e.g. "Missing #EXTM3U header"). */
      detail?: string;
    }
  | {
      type: 'network';
      /** Underlying OS error code, if available. */
      code?: string | number;
    }
  | {
      /** Raised when a bundle-only feature is accessed without a license. */
      type: 'bundle_required';
      /** The bundle name required, e.g. "ntv". */
      bundleName: string;
    }
  | {
      type: 'auth';
      /** Server-supplied auth failure detail. */
      detail?: string;
    }
  | {
      /** DRM decryption failure — non-retryable. */
      type: 'drm_error';
      errorCode?: string | number;
    };

// ---------------------------------------------------------------------------
// User-facing messages
// ---------------------------------------------------------------------------

/** Default user-facing message for each VideoError variant. */
export const VIDEO_ERROR_MESSAGES: Record<VideoErrorType, string> = {
  stream_unavailable:
    'The stream is currently unavailable. Please check your connection or try another channel.',
  m3u_parse_failed:
    'Failed to load the playlist. Check the M3U URL in Settings and try again.',
  network:
    'Network error. Make sure you have an active internet connection and retry.',
  bundle_required:
    'This feature requires the ɳTV bundle. Upgrade in Settings to unlock.',
  auth:
    'Authentication failed. Your Xtream credentials may be incorrect or expired.',
  drm_error:
    'This stream uses DRM protection that could not be decrypted on this device.',
};

/** Returns the default user-facing message for a VideoError. */
export function getVideoErrorMessage(err: VideoError): string {
  return VIDEO_ERROR_MESSAGES[err.type];
}

/** Returns true for errors the user can retry. DRM and bundle errors are not retryable. */
export function isRetryableError(err: VideoError): boolean {
  return err.type !== 'drm_error' && err.type !== 'bundle_required';
}

// ---------------------------------------------------------------------------
// Result<T, E>
// ---------------------------------------------------------------------------

/** Lightweight Ok/Err discriminated union — no external deps. */
export type Result<T, E = VideoError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Construct an Ok result. */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Construct an Err result. */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Narrow a Result to its value, or throw if it is an error. */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
