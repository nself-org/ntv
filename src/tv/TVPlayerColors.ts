/**
 * Purpose: Shared colour constants for the ɳTV TV player screens and overlays.
 * Inputs:  none
 * Outputs: TV_COLORS object — high-contrast dark-TV palette.
 * Constraints: Import-only; never import from component files back into this file.
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-player-colors
 */

export const TV_COLORS = {
  bg: '#000000',
  overlay: 'rgba(0,0,0,0.65)',
  text: '#ffffff',
  muted: '#9ca3af',
  focusBorder: '#fbbf24',
  focusBg: 'rgba(251, 191, 36, 0.15)',
  error: '#ef4444',
  primary: '#0ea5e9',
} as const;

/** Step size in seconds for D-pad seek actions. */
export const SEEK_STEP = 10;

/** Milliseconds of inactivity before the controls overlay auto-dismisses. */
export const CONTROLS_DISMISS_MS = 5000;
