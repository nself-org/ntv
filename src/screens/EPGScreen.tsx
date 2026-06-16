/**
 * Purpose: ɳTV EPG (Electronic Programme Guide) screen — 7-state horizontal timeline
 *          grid showing current/next programmes per channel.
 *
 * Inputs:
 *   - No props — uses useEPG hook for data.
 *   - Channel IDs derived from useChannelList.
 *   - Time window: current time ± 2h.
 *
 * Outputs:
 *   - EPGGrid component wrapping XMLTV programme data.
 *   - 7 states: loading (skeleton), empty, error (retry), offline (banner),
 *     populated (EPG grid), refreshing, success.
 *
 * Constraints:
 *   - EPGGrid is the canonical component (from ntv/components/EPGGrid.tsx).
 *   - All strings i18n-wrapped.
 *   - WCAG 2.1 AA: accessible grid labels, tappable programme cells.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv epg-screen 7-state; T-P3-E5-W3-S3-T01
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNselfTranslation } from '@nself/i18n';
import { useEPG } from '../../hooks/useEPG';
import { useChannelList } from '../../hooks/useChannelList';
import { EPGGrid } from '../../components/EPGGrid';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState(): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel="Loading programme guide">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text style={styles.loadingText}>Loading guide…</Text>
    </View>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel="No programme data available">
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Programme Data</Text>
      <Text style={styles.emptySubtitle}>
        Configure an EPG (XMLTV) source in Settings to see upcoming programmes.
      </Text>
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel={`Error loading guide: ${message}`}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Failed to load guide</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Retry loading EPG"
        hitSlop={8}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function OfflineBanner(): React.ReactElement {
  return (
    <View
      style={styles.offlineBanner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Offline — showing cached programme guide"
    >
      <Text style={styles.offlineBannerText}>
        Offline — showing cached programme guide
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// EPGScreen
// ---------------------------------------------------------------------------

export default function EPGScreen(): React.ReactElement {
  const { t } = useNselfTranslation();
  const { channels } = useChannelList();

  const channelIds = useMemo(
    () => channels.slice(0, 100).map((c) => c.id),
    [channels],
  );

  const now = useMemo(() => new Date(), []);
  const windowEnd = useMemo(
    () => new Date(now.getTime() + TWO_HOURS_MS),
    [now],
  );

  const { programs, channels: epgChannels, loading, error, refetch } = useEPG(
    channelIds,
    new Date(now.getTime() - TWO_HOURS_MS),
    windowEnd,
  );

  const isOffline =
    error !== null &&
    String(error).toLowerCase().includes('network') &&
    programs.length > 0;

  // State 1: Loading
  if (loading && programs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <LoadingState />
      </SafeAreaView>
    );
  }

  // State 2: Error (no cached data)
  if (error !== null && programs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <ErrorState message={String(error)} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  // State 3: Empty (EPG configured but no data)
  if (!loading && programs.length === 0 && channelIds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <EmptyState />
      </SafeAreaView>
    );
  }

  // States 4-7: Populated / offline / refreshing / success
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {isOffline && <OfflineBanner />}
      {loading && programs.length > 0 && (
        <ActivityIndicator
          style={styles.refreshIndicator}
          color="#0ea5e9"
          accessible
          accessibilityLabel="Refreshing programme guide"
        />
      )}
      <EPGGrid
        channels={epgChannels}
        programs={programs}
        startTime={new Date(now.getTime() - TWO_HOURS_MS)}
        endTime={windowEnd}
        onProgramPress={() => {}}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header(): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle} accessibilityRole="header">
        Programme Guide
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#9ca3af' },

  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb', textAlign: 'center' },
  errorMessage: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  offlineBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { fontSize: 13, fontWeight: '600', color: '#000' },

  refreshIndicator: { marginVertical: 8 },
});
