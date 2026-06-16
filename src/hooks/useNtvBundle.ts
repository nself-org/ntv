/**
 * useNtvBundle Hook
 *
 * Purpose:
 * Read the NSELF_BUNDLE environment variable to determine if ɳTV Bundle is
 * built-in to this variant. This is set at build time by EAS profiles (T11).
 *
 * Inputs:
 * - process.env.EXPO_PUBLIC_NSELF_BUNDLE (set by app.config.ts)
 *
 * Outputs:
 * - { isBundle: boolean } — true if NSELF_BUNDLE=ntv, false if NSELF_BUNDLE=false
 *
 * Constraints:
 * - Read-only, cannot change at runtime
 * - Different from useIap hook: useNtvBundle is flavor-time, useIap is purchase-time
 * - Used to conditionally render IAP fallback screen (only in free variant)
 *
 * SPORT:
 * - F06-BUNDLE-INVENTORY.md (bundle feature gates)
 * - T-P3-E4-W2-S4-T11 (flavor system)
 */

/**
 * Hook for reading the nTV Bundle build-time flavor flag.
 * True only when built with NSELF_BUNDLE=ntv profile.
 */
export function useNtvBundle() {
  const isBundle = process.env.EXPO_PUBLIC_NSELF_BUNDLE === 'ntv';

  return {
    isBundle,
  };
}
