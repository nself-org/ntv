/**
 * Purpose: Loading, empty, error, and offline state UI components for the ɳTV Channel List.
 * Inputs:  EmptyStateProps (onAddSource), ErrorStateProps (message, onRetry).
 * Outputs: LoadingSkeleton, EmptyState, ErrorState, OfflineBanner — pure presentational.
 * Constraints: WCAG 2.1 AA labels on all interactive elements. No state management.
 * SPORT: F12-REPO-TYPE-MAP.md — ntv channel-list-states
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNselfTranslation } from '@nself/i18n';
import { CHANNEL_LIST_COLORS as C } from './ChannelListColors';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
  return (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonLogo, { backgroundColor: C.skeleton }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '60%', backgroundColor: C.skeleton }]} />
        <View style={[styles.skeletonLine, { width: '35%', backgroundColor: C.skeleton, marginTop: 4 }]} />
      </View>
    </View>
  );
}

/** Renders 8 skeleton rows while channel data is loading. */
export function LoadingSkeleton(): React.ReactElement {
  return (
    <View style={styles.skeletonContainer} accessible accessibilityLabel="Loading channels">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Called when the user taps "Add M3U Playlist". */
  onAddSource: () => void;
}

/** Shown when no M3U or Xtream sources are configured. */
export function EmptyState({ onAddSource }: EmptyStateProps): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <View style={styles.centered} accessible accessibilityLabel="No M3U playlist added">
      <Text style={styles.emptyIcon}>📺</Text>
      <Text style={styles.emptyTitle}>No IPTV Sources</Text>
      <Text style={styles.emptySubtitle}>
        Add an M3U playlist URL to start watching live TV.
      </Text>
      <Pressable
        style={styles.ctaButton}
        onPress={onAddSource}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Add M3U playlist"
        hitSlop={8}
      >
        <Text style={styles.ctaText}>Add M3U Playlist</Text>
      </Pressable>
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Shown when source fetch fails and there is no cached data to display. */
export function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel={`Error: ${message}`}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Failed to load channels</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Retry loading channels"
        hitSlop={8}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────

/** Shown over the channel list when the device is offline and cached data is displayed. */
export function OfflineBanner(): React.ReactElement {
  return (
    <View
      style={styles.offlineBanner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Offline — showing cached channels"
    >
      <Text style={styles.offlineBannerText}>
        Offline — showing cached channels
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  skeletonContainer: { paddingTop: 8 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 64,
  },
  skeletonLogo: { width: 44, height: 44, borderRadius: 6, marginEnd: 12 },
  skeletonContent: { flex: 1 },
  skeletonLine: { height: 12, borderRadius: 6 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8 },
  ctaButton: {
    marginTop: 20,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center' },
  errorMessage: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  retryButton: {
    marginTop: 20,
    backgroundColor: C.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  offlineBanner: {
    backgroundColor: C.offline,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { fontSize: 13, fontWeight: '600', color: '#000' },
});
