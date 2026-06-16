/**
 * useNtvBundle — Feature flag for ɳTV bundle presence
 *
 * Purpose:
 *   Detects if the app was built with the ɳTV bundle variant (NSELF_BUNDLE=ntv).
 *   Used to gate bundle-exclusive features, hide upsell UI, and suppress fallback screens.
 *
 * Inputs:
 *   Environment: NSELF_BUNDLE env var (set at build time via eas.json profile)
 *
 * Outputs:
 *   { isBundle: boolean } — true if bundle variant, false if free FOSS variant
 *
 * Constraints:
 *   Read-only. Set at build time via eas.json profiles; cannot be changed at runtime.
 */

export function useNtvBundle() {
  const isBundle = process.env.NSELF_BUNDLE === 'ntv';
  return { isBundle };
}
