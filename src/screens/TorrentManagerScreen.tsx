/**
 * Purpose: ɳTV TorrentManager screen — add magnet/torrent URL, view download progress,
 *          pause/resume downloads. Bundle-gated (ɳTV bundle required).
 *          Sub-components extracted to TorrentManagerComponents.tsx.
 *
 * Inputs:
 *   - useNtvBundle hook for license gate check.
 *   - Torrent list + CRUD ops via AsyncStorage.
 *
 * Outputs:
 *   - Add-torrent form, FlatList of downloads, bundle gate if not licensed.
 *
 * Constraints:
 *   - Bundle gate MUST be server-validated (not just UI hidden).
 *   - validateTorrentUrl from src/lib/validators.ts.
 *   - 7 states: loading, empty, error, offline, populated, adding, bundle_required.
 *   - WCAG 2.1 AA: accessible labels on all controls.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv torrent-manager-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNselfTranslation } from '@nself/i18n';
import { useNtvBundle } from '../hooks/useNtvBundle';
import { validateTorrentUrl } from '../lib/validators';
import { VIDEO_ERROR_MESSAGES } from '../types/video-errors';
import {
  AddForm,
  BundleGateCard,
  TorrentManagerHeader,
  TorrentRow,
  extractName,
} from './TorrentManagerComponents';
import type { TorrentItem, TorrentStatus } from './TorrentManagerComponents';

export type { TorrentItem, TorrentStatus };

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ntv:torrents:list';

// ---------------------------------------------------------------------------
// TorrentManagerScreen
// ---------------------------------------------------------------------------

export default function TorrentManagerScreen(): React.ReactElement {
  const { t } = useNselfTranslation();
  const { isBundle } = useNtvBundle();

  const [items, setItems] = useState<TorrentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUrl, setAddUrl] = useState('');
  const [addUrlError, setAddUrlError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setItems(raw ? (JSON.parse(raw) as TorrentItem[]) : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistItems = useCallback(async (updated: TorrentItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setItems(updated);
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  // ---------------------------------------------------------------------------
  // Add torrent
  // ---------------------------------------------------------------------------

  const handleAdd = useCallback(async () => {
    if (!isBundle) {
      Alert.alert('ɳTV Bundle Required', VIDEO_ERROR_MESSAGES.bundle_required, [{ text: 'OK' }]);
      return;
    }

    const validation = validateTorrentUrl(addUrl);
    if (!validation.ok) {
      setAddUrlError(validation.message);
      return;
    }

    setAddUrlError(null);
    setAdding(true);

    try {
      const newItem: TorrentItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: addUrl.trim(),
        name: extractName(addUrl.trim()),
        status: 'queued',
        progress: 0,
        downloadSpeed: null,
        totalSize: null,
        addedAt: new Date().toISOString(),
      };
      await persistItems([...items, newItem]);
      setAddUrl('');
      inputRef.current?.blur();
    } catch {
      Alert.alert('Error', 'Failed to add torrent. Please try again.');
    } finally {
      setAdding(false);
    }
  }, [isBundle, addUrl, items, persistItems]);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const handlePause = useCallback(
    async (id: string) => {
      const updated = items.map((it) =>
        it.id === id ? { ...it, status: 'paused' as TorrentStatus } : it,
      );
      await persistItems(updated);
    },
    [items, persistItems],
  );

  const handleResume = useCallback(
    async (id: string) => {
      const updated = items.map((it) =>
        it.id === id ? { ...it, status: 'downloading' as TorrentStatus } : it,
      );
      await persistItems(updated);
    },
    [items, persistItems],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      Alert.alert('Remove Download', 'Remove this download from the list?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await persistItems(items.filter((it) => it.id !== id));
          },
        },
      ]);
    },
    [items, persistItems],
  );

  const renderItem = useCallback(
    ({ item }: { item: TorrentItem }) => (
      <TorrentRow item={item} onPause={handlePause} onResume={handleResume} onRemove={handleRemove} />
    ),
    [handlePause, handleResume, handleRemove],
  );

  const keyExtractor = useCallback((item: TorrentItem) => item.id, []);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (!isBundle) {
    return (
      <SafeAreaView style={styles.container}>
        <TorrentManagerHeader />
        <BundleGateCard />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TorrentManagerHeader />
        <AddForm value={addUrl} onChange={setAddUrl} onAdd={handleAdd} adding={adding} error={addUrlError} inputRef={inputRef} />
        <View style={styles.centered} accessible accessibilityLabel="Loading downloads">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TorrentManagerHeader />
        <AddForm value={addUrl} onChange={setAddUrl} onAdd={handleAdd} adding={adding} error={addUrlError} inputRef={inputRef} />
        <View style={styles.centered} accessible accessibilityLabel="No downloads">
          <Text style={styles.emptyIcon}>⬇️</Text>
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptySubtitle}>
            Paste a magnet link or .torrent URL above to start downloading.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TorrentManagerHeader />
      <AddForm value={addUrl} onChange={setAddUrl} onAdd={handleAdd} adding={adding} error={addUrlError} inputRef={inputRef} />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        onRefresh={loadItems}
        refreshing={loading}
        accessible
        accessibilityLabel="Downloads list"
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  listContent: { paddingVertical: 8, paddingBottom: 40 },
});
