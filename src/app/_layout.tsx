/**
 * Purpose: Root layout — wraps all screens with i18n provider, Sentry/OTel init, push notifications, and tab navigation.
 * Inputs:  none
 * Outputs: Expo Router Stack with (tabs) layout
 * Constraints: Expo Router v3+ file-based routing. @nself/observability init on mount.
 *              Push notification permissions requested once on app start.
 *              i18n provider wraps entire app for translation + RTL support.
 *              LocaleContext allows SettingsScreen to dynamically change locale.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T13
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import TrackPlayer from 'react-native-track-player';
import { initObservability } from '@nself/observability';
import { NselfI18nProvider } from '@nself/i18n';
import type { Locale } from '@nself/i18n';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeI18n, getDeviceLocale } from '@/i18n';
import { PlaybackService } from '../../services/backgroundAudioService';

// Register background audio service once at app boot.
// Must run before TrackPlayer.setupPlayer() (called lazily in useBackgroundAudio).
TrackPlayer.registerPlaybackService(() => PlaybackService);

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const OTEL_ENDPOINT = process.env.EXPO_PUBLIC_OTEL_ENDPOINT ?? '';

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
    // Sentry + OTel bootstrap — Sentry SDK will be injected at build time.
    // initObservability gracefully no-ops if Sentry SDK is not injected.
    if (SENTRY_DSN || OTEL_ENDPOINT) {
      initObservability({
        otel: OTEL_ENDPOINT
          ? {
              serviceName: 'ntv',
              endpoint: OTEL_ENDPOINT,
            }
          : undefined,
      });
    }

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

export default function RootLayout(): React.ReactElement {
  const [locale, setLocale] = useState<Locale>(getDeviceLocale() as Locale);

  return (
    <LocaleProvider>
      <NselfI18nProvider locale={locale}>
        <RootContent />
      </NselfI18nProvider>
    </LocaleProvider>
  );
}
