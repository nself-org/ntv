/**
 * Purpose: Shared color constants for the Channel List screen and its subcomponents.
 * Inputs:  none
 * Outputs: CHANNEL_LIST_COLORS object — dark-first palette matching ntv design system.
 * Constraints: Import-only (no React); never import from screen files.
 * SPORT: F12-REPO-TYPE-MAP.md — ntv channel-list colors
 */

/** Shared colour constants for the Channel List screen and its sub-components. */
export const CHANNEL_LIST_COLORS = {
  bg: '#030712',
  surface: '#111827',
  border: '#1f2937',
  primary: '#0ea5e9',
  text: '#f9fafb',
  muted: '#9ca3af',
  dim: '#6b7280',
  error: '#ef4444',
  skeleton: '#1f2937',
  skeletonShimmer: '#374151',
  offline: '#f59e0b',
  live: '#ef4444',
} as const;
