/**
 * Purpose: Library screen state components and card for ɳTV.
 *          Extracted from LibraryScreen.tsx to keep that file under 300 lines.
 *          Contains: LoadingState, EmptyState, ErrorState, TmdbUpsellBanner, LibraryCard.
 *
 * Inputs:
 *   LibraryCard — item: LibraryItem, onPress: (item: LibraryItem) => void.
 *   ErrorState  — message, onRetry.
 *
 * Outputs: Styled state views and card component. No business logic.
 *
 * Constraints:
 *   - WCAG 2.1 AA: accessible labels on all interactive elements.
 *   - TMDB upsell is bundle-feature awareness only — no network calls here.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv library-screen-components
 */

import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LibraryItem } from './LibraryScreen';

// ─── Loading state ────────────────────────────────────────────────────────────

export function LoadingState(): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel="Loading library">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text style={styles.loadingText}>Loading library…</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState(): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel="Library is empty">
      <Text style={styles.stateIcon}>🎬</Text>
      <Text style={styles.stateTitle}>Library is Empty</Text>
      <Text style={styles.stateSubtitle}>Recordings and downloaded content will appear here.</Text>
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel={`Library error: ${message}`}>
      <Text style={styles.stateIcon}>⚠️</Text>
      <Text style={styles.stateTitle}>Failed to load library</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Retry"
        hitSlop={8}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// ─── TMDB upsell banner ───────────────────────────────────────────────────────

export function TmdbUpsellBanner(): React.ReactElement {
  return (
    <View
      style={styles.upsellBanner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Upgrade to ntv bundle to see movie posters and metadata"
    >
      <Text style={styles.upsellTitle}>🎬 Unlock TMDB Posters</Text>
      <Text style={styles.upsellText}>
        Upgrade to the nTV bundle to see movie posters, ratings, and metadata for your recordings.
      </Text>
    </View>
  );
}

// ─── Library card ─────────────────────────────────────────────────────────────

export interface LibraryCardProps {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
}

export const LibraryCard = React.memo(function LibraryCard({
  item,
  onPress,
}: LibraryCardProps): React.ReactElement {
  const durationLabel = item.duration ? `${Math.floor(item.duration / 60)}m` : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(item)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}${durationLabel ? `, ${durationLabel}` : ''}`}
    >
      {item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.posterIcon}>{item.type === 'recording' ? '⏺' : '⬇'}</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardType}>{item.type === 'recording' ? 'Recording' : 'Download'}</Text>
          {durationLabel && <Text style={styles.cardDuration}>{durationLabel}</Text>}
          {item.rating !== undefined && (
            <Text style={styles.cardRating}>★ {item.rating.toFixed(1)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#9ca3af' },
  stateIcon: { fontSize: 48, marginBottom: 16 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb', textAlign: 'center' },
  stateSubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },
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
  upsellBanner: {
    backgroundColor: '#1e1b4b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  upsellTitle: { fontSize: 14, fontWeight: '700', color: '#a5b4fc', marginBottom: 4 },
  upsellText: { fontSize: 12, color: '#818cf8', lineHeight: 18 },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardPressed: { opacity: 0.8 },
  poster: { width: '100%', aspectRatio: 2 / 3 },
  posterPlaceholder: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  posterIcon: { fontSize: 36 },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#f9fafb', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  cardType: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  cardDuration: { fontSize: 11, color: '#9ca3af' },
  cardRating: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
});
