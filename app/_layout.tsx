/**
 * Purpose: Root layout for ɳTV Expo Router app.
 * Wraps the entire app with safe area context and expo-status-bar.
 * Initialises Sentry error reporting.
 * Outputs: Stack navigator root with single "(tabs)" stack entry.
 * Constraints: Expo Router v3+ file-based routing. Dark UI style.
 * SPORT: F12-REPO-TYPE-MAP.md ntv RN+Expo
 */

import * as SentryRN from '@sentry/react-native';
import { initObservability } from '@nself/observability';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Initialize Sentry error reporting (runs at module load, before first render)
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  initObservability({
    sentry: {
      sdk: SentryRN as any, // React Native SDK has different signature; type coercion needed
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: process.env.APP_ENV ?? 'development',
      appKind: 'native' as const,
      release: process.env.EXPO_PUBLIC_APP_VERSION ?? '1.2.0',
      tracesSampleRate: process.env.APP_ENV === 'production' ? 0.2 : 1.0,
    },
  });
}

function RootLayout(): React.ReactElement {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default SentryRN.wrap(RootLayout);
