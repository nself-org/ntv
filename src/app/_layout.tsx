/**
 * Purpose: Root layout — wraps all screens with i18n provider, Sentry/OTel init, push notifications, and tab navigation.
 * Inputs:  EXPO_PUBLIC_SENTRY_DSN, EXPO_PUBLIC_OTEL_ENDPOINT, APP_ENV, EXPO_PUBLIC_APP_VERSION from build env.
 * Outputs: Expo Router Stack with (tabs) layout; Sentry + OTel registered for native crash and error reporting.
 * Constraints: Expo Router v3+ file-based routing. @nself/observability init at module level (before first render).
 *              @sentry/react-native SDK injected via initObservability for native crash capture.
 *              Sentry.wrap() applied to default export for native thread crash capture.
 *              Push notification permissions requested once on app start.
 *              i18n provider wraps entire app for translation + RTL support.
 *              LocaleContext allows SettingsScreen to dynamically change locale.
 *              PII scrubbing runs unconditionally via scrubEvent as beforeSend inside initObservability.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T13
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import TrackPlayer from 'react-native-track-player';
import * as SentryRN from '@sentry/react-native';
import type { SentrySdk } from '@nself/observability';
import { initObservability } from '@nself/observability';
import { NselfI18nProvider } from '@nself/i18n';
import type { Locale } from '@nself/i18n';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeI18n, getDeviceLocale } from '@/i18n';
import { PlaybackService } from '../../services/backgroundAudioService';

// Register background audio service once at app boot.
// Must run before TrackPlayer.setupPlayer() (called lazily in useBackgroundAudio).
TrackPlayer.registerPlaybackService(() => PlaybackService);

// ─── Sentry + OTel init (module level — before first render) ─────────────────
// initObservability calls Sentry.init() with scrubEvent as beforeSend (PII scrubbing)
// and registers OTel tracing. Gracefully no-ops if DSN is absent.
initObservability({
  sentry: {
    sdk: SentryRN as unknown as SentrySdk,
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    environment: process.env.APP_ENV ?? 'development',
    appKind: 'native' as const,
    tracesSampleRate: process.env.APP_ENV === 'production' ? 0.2 : 1.0,
    release: process.env.EXPO_PUBLIC_APP_VERSION ?? '1.1.1',
  },
  otel: process.env.EXPO_PUBLIC_OTEL_ENDPOINT
    ? {
        serviceName: 'ntv',
        endpoint: process.env.EXPO_PUBLIC_OTEL_ENDPOINT,
      }
    : undefined,
});

/**
 * LocaleContext — allows nested components to change locale dynamically
 */
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};

function RootContent(): React.ReactElement {
  const { requestPermission } = useNotifications();
  const { locale } = useLocale();

  useEffect(() => {
    // Initialize i18n with device locale or override
    initializeI18n(locale);
  }, [locale]);

  useEffect(() => {
    // Request notification permission once on app startup (in background, no prompt blocking UI)
    requestPermission().catch((e) => {
      console.warn('[RootLayout] Failed to request notification permission:', e);
    });
  }, [requestPermission]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}

function LocaleProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocale] = useState<Locale>(getDeviceLocale() as Locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

function RootLayout(): React.ReactElement {
  const [locale, setLocale] = useState<Locale>(getDeviceLocale() as Locale);

  return (
    <LocaleProvider>
      <NselfI18nProvider locale={locale}>
        <RootContent />
      </NselfI18nProvider>
    </LocaleProvider>
  );
}

// Sentry.wrap captures native crash reports (JS thread + native thread crashes).
export default SentryRN.wrap(RootLayout);
