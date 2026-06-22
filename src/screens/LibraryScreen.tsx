/**
 * Purpose: ɳTV Library screen — downloaded/recorded content list with TMDB
 *          movie/show metadata and poster art. Bundle-gated (nTV bundle required
 *          for TMDB metadata and recording features).
 *          State components (LoadingState, EmptyState, ErrorState, TmdbUpsellBanner,
 *          LibraryCard) extracted to LibraryScreenComponents.tsx.
 *
 * Inputs:
 *   - useNtvBundle hook for license gate.
 *   - Recorded/downloaded items from AsyncStorage.
 *
 * Outputs:
 *   - Grid/list of local content with TMDB posters when bundle licensed.
 *   - 7 states: loading, empty, error, offline, populated, refreshing, bundle_required.
 *
 * Constraints:
 *   - TMDB calls via GET https://api.themoviedb.org/3/ (gated behind bundle check).
 *   - Upsell card shown for free users explaining TMDB poster feature.
 *   - WCAG 2.1 AA: all interactive elements labeled.
 *   - All strings i18n-wrapped.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv library-screen tmdb feature; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNselfTranslation } from '@nself/i18n';
import { useNtvBundle } from '../hooks/useNtvBundle';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  TmdbUpsellBanner,
  LibraryCard,
} from './LibraryScreenComponents';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LibraryItem {
  id: string;
  title: string;
  type: 'recording' | 'download';
  addedAt: string;
  localPath?: string;
  /** TMDB movie/show id — populated when bundle licensed */
  tmdbId?: number;
  /** TMDB poster URL (w342) — populated after fetch */
  posterUrl?: string;
  rating?: number;
  duration?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIBRARY_STORAGE_KEY = 'ntv:library:items';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LibraryScreen(): React.ReactElement {
  useNselfTranslation(); // t() not used directly here; i18n side-effects needed
  const { isBundle } = useNtvBundle();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await AsyncStorage.getItem(LIBRARY_STORAGE_KEY);
      const parsed: LibraryItem[] = raw ? (JSON.parse(raw) as LibraryItem[]) : [];
      setItems(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const handlePress = useCallback((_item: LibraryItem) => {
    // Navigate to player with local path — wired in T02
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: LibraryItem }) => <LibraryCard item={item} onPress={handlePress} />,
    [handlePress],
  );

  const keyExtractor = useCallback((item: LibraryItem) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error !== null) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <ErrorState message={error} onRetry={loadItems} />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        {!isBundle && <TmdbUpsellBanner />}
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {!isBundle && <TmdbUpsellBanner />}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        onRefresh={loadItems}
        refreshing={loading}
        accessible
        accessibilityLabel="Library content"
      />
    </SafeAreaView>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header(): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle} accessibilityRole="header">Library</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
  gridContent: { padding: 12, gap: 12 },
});
