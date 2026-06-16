/**
 * app.config.ts — Expo App Configuration with Flavor Support
 *
 * Purpose:
 * Configure Expo app with dynamic bundle ID, name, and environment variables
 * based on build flavor. Two variants:
 * - Free: NSELF_BUNDLE=false, bundle ID org.nself.ntv, name "ɳTV"
 * - Bundle: NSELF_BUNDLE=ntv, bundle ID org.nself.ntv.bundle, name "ɳTV Bundle"
 *
 * Inputs:
 * - process.env.NSELF_BUNDLE (set by eas.json profile in T11)
 * - EAS_BUILD_PROFILE (auto-set by EAS)
 *
 * Outputs:
 * - Expo config with variant-specific bundle IDs, names, env vars
 * - StoreKit sandbox configuration for dev builds
 *
 * Constraints:
 * - Build-time configuration (cannot change at runtime)
 * - Bundle IDs must differ to allow both variants on App Store simultaneously
 * - StoreKit sandbox enabled for useStaging = 'true' in dev
 *
 * SPORT:
 * - F06-BUNDLE-INVENTORY.md (bundle status)
 * - F07-PRICING-TIERS.md (product identifiers)
 * - T-P3-E4-W2-S4-T11 (flavor system integration)
 */

import { ExpoConfig, ConfigContext } from 'expo/config';

const isBundle = process.env.NSELF_BUNDLE === 'ntv';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig = config as ExpoConfig;
  return {
    ...baseConfig,
    name: isBundle ? 'ɳTV Bundle' : 'ɳTV',
    slug: 'ntv',
    ios: {
      ...(baseConfig.ios || {}),
      bundleIdentifier: isBundle ? 'org.nself.ntv.bundle' : 'org.nself.ntv',
    },
    android: {
      ...(baseConfig.android || {}),
      package: isBundle ? 'org.nself.ntv.bundle' : 'org.nself.ntv',
    },
    extra: {
      ...(baseConfig.extra || {}),
      nselfBundle: isBundle ? 'ntv' : 'false',
      useStaging: process.env.EAS_BUILD_PROFILE !== 'production' ? 'true' : 'false',
      EXPO_PUBLIC_NSELF_BUNDLE: isBundle ? 'ntv' : 'false',
      EXPO_PUBLIC_NSELF_API_URL: process.env.EXPO_PUBLIC_NSELF_API_URL || 'https://api.nself.org',
    },
  };
};
