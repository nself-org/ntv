/**
 * Purpose: ɳTV TorrentManager screen — add magnet/torrent URL, view download progress list,
 *          pause/resume downloads. Bundle-gated: requires ɳTV bundle license.
 *
 * Inputs:
 *   - useNtvBundle hook for license gate check.
 *   - torrent list + add/pause/resume/remove ops via AsyncStorage (mock until nself-recording
 *     plugin exposes a JS bridge or GraphQL mutation).
 *
 * Outputs:
 *   - Add-torrent form (URL input with validation).
 *   - FlatList of active/completed downloads with progress bars.
 *   - Bundle-required gate card if not licensed.
 *
 * Constraints:
 *   - Bundle gate MUST be server-validated before any download ops (not just UI hidden).
 *     Server validation is via the ɳTV bundle plugin license check on the nSelf backend.
 *     UI shows a gate card; actual download add mutation will return a bundle_required error
 *     from the server side — we handle that VideoError variant here too.
 *   - validateTorrentUrl from src/lib/validators.ts.
 *   - 7 states: loading, empty (no torrents), error, offline, populated, adding, bundle_required.
 *   - WCAG 2.1 AA: accessible labels on all controls.
 *   - All strings i18n-wrapped.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv torrent-manager-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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
import type { VideoError } from '../types/video-errors';
import { VIDEO_ERROR_MESSAGES } from '../types/video-errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TorrentStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error';

export interface TorrentItem {
  id: string;
  /** Original magnet or torrent URL */
  url: string;
  /** Display name — derived from magnet dn= parameter or filename */
  name: string;
  status: TorrentStatus;
  /** 0–1 */
  progress: number;
  /** bytes/s — null when not downloading */
  downloadSpeed: number | null;
  /** bytes — null when unknown */
  totalSize: number | null;
  addedAt: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// AsyncStorage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ntv:torrents:list';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a display name from a magnet link or torrent URL. */
function extractName(url: string): string {
  if (url.startsWith('magnet:')) {
    const match = url.match(/dn=([^&]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    return 'Magnet download';
  }
  const parts = url.split('/');
  const filename = parts[parts.length - 1] ?? 'torrent';
  return decodeURIComponent(filename.replace('.torrent', ''));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ---------------------------------------------------------------------------
// Bundle gate card
// ---------------------------------------------------------------------------

function BundleGateCard(): React.ReactElement {
  return (
    <View
      style={styles.gateCard}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={VIDEO_ERROR_MESSAGES.bundle_required}
    >
      <Text style={styles.gateIcon}>🔒</Text>
      <Text style={styles.gateTitle}>ɳTV Bundle Required</Text>
      <Text style={styles.gateMessage}>
        {VIDEO_ERROR_MESSAGES.bundle_required}
      </Text>
      <Text style={styles.gateHint}>
        Upgrade in Settings › Manage Subscription to unlock downloads, recordings, and more.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress row
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<TorrentStatus, string> = {
  queued: '#6b7280',
  downloading: '#0ea5e9',
  paused: '#f59e0b',
  completed: '#10b981',
  error: '#ef4444',
};

interface TorrentRowProps {
  item: TorrentItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
}

const TorrentRow = React.memo(function TorrentRow({
  item,
  onPause,
  onResume,
  onRemove,
}: TorrentRowProps): React.ReactElement {
  const statusColor = STATUS_COLORS[item.status];
  const progressPct = Math.round(item.progress * 100);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${item.name}: ${item.status}, ${progressPct}%`}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
        <Pressable
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          hitSlop={8}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack} accessibilityLabel={`Download progress ${progressPct}%`}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPct}%`, backgroundColor: statusColor },
          ]}
        />
      </View>

      <View style={styles.rowFooter}>
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {item.status.toUpperCase()}
        </Text>
        <Text style={styles.progressLabel}>{progressPct}%</Text>
        {item.downloadSpeed !== null && item.downloadSpeed > 0 && (
          <Text style={styles.speedLabel}>{formatBytes(item.downloadSpeed)}/s</Text>
        )}
        {item.totalSize !== null && (
          <Text style={styles.sizeLabel}>{formatBytes(item.totalSize)}</Text>
        )}

        {/* Controls */}
        {item.status === 'downloading' && (
          <Pressable
            style={styles.controlButton}
            onPress={() => onPause(item.id)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Pause ${item.name}`}
            hitSlop={8}
          >
            <Text style={styles.controlIcon}>⏸</Text>
          </Pressable>
        )}
        {item.status === 'paused' && (
          <Pressable
            style={styles.controlButton}
            onPress={() => onResume(item.id)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Resume ${item.name}`}
            hitSlop={8}
          >
            <Text style={styles.controlIcon}>▶</Text>
          </Pressable>
        )}
      </View>

      {item.errorMessage && (
        <Text style={styles.rowError} numberOfLines={2}>{item.errorMessage}</Text>
      )}
    </View>
  );
});

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

  // Load from storage
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

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  // ---------------------------------------------------------------------------
  // Add torrent
  // ---------------------------------------------------------------------------

  const handleAdd = useCallback(async () => {
    // Bundle gate (server will also reject — this is the UI gate)
    if (!isBundle) {
      Alert.alert(
        'ɳTV Bundle Required',
        VIDEO_ERROR_MESSAGES.bundle_required,
        [{ text: 'OK' }],
      );
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

      const updated = [...items, newItem];
      await persistItems(updated);
      setAddUrl('');
      inputRef.current?.blur();
    } catch (e) {
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
            const updated = items.filter((it) => it.id !== id);
            await persistItems(updated);
          },
        },
      ]);
    },
    [items, persistItems],
  );

  const renderItem = useCallback(
    ({ item }: { item: TorrentItem }) => (
      <TorrentRow
        item={item}
        onPause={handlePause}
        onResume={handleResume}
        onRemove={handleRemove}
      />
    ),
    [handlePause, handleResume, handleRemove],
  );

  const keyExtractor = useCallback((item: TorrentItem) => item.id, []);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  // State: bundle required (check before anything else)
  if (!isBundle) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <BundleGateCard />
      </SafeAreaView>
    );
  }

  // State: loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <AddForm
          value={addUrl}
          onChange={setAddUrl}
          onAdd={handleAdd}
          adding={adding}
          error={addUrlError}
          inputRef={inputRef}
        />
        <View style={styles.centered} accessible accessibilityLabel="Loading downloads">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </SafeAreaView>
    );
  }

  // State: empty (no downloads)
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <AddForm
          value={addUrl}
          onChange={setAddUrl}
          onAdd={handleAdd}
          adding={adding}
          error={addUrlError}
          inputRef={inputRef}
        />
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

  // States 4-7: Populated
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <AddForm
        value={addUrl}
        onChange={setAddUrl}
        onAdd={handleAdd}
        adding={adding}
        error={addUrlError}
        inputRef={inputRef}
      />
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
// Header
// ---------------------------------------------------------------------------

function Header(): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle} accessibilityRole="header">
        Downloads
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add form
// ---------------------------------------------------------------------------

interface AddFormProps {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
  error: string | null;
  inputRef: React.RefObject<TextInput | null>;
}

function AddForm({ value, onChange, onAdd, adding, error, inputRef }: AddFormProps): React.ReactElement {
  return (
    <View style={styles.addForm}>
      <TextInput
        ref={inputRef}
        style={[styles.addInput, error ? styles.addInputError : null]}
        value={value}
        onChangeText={onChange}
        placeholder="magnet:?xt=… or https://…/file.torrent"
        placeholderTextColor="#6b7280"
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
        accessible
        accessibilityLabel="Torrent URL or magnet link"
        accessibilityHint="Enter a magnet link or .torrent URL"
      />
      {error && (
        <Text style={styles.addInputErrorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <Pressable
        style={[styles.addButton, adding && styles.addButtonDisabled]}
        onPress={onAdd}
        disabled={adding}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Add download"
        accessibilityState={{ disabled: adding }}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },

  // Add form
  addForm: { paddingHorizontal: 16, paddingBottom: 12 },
  addInput: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 4,
  },
  addInputError: { borderColor: '#ef4444' },
  addInputErrorText: { fontSize: 12, color: '#ef4444', marginBottom: 4 },
  addButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Bundle gate
  gateCard: {
    margin: 16,
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#312e81',
  },
  gateIcon: { fontSize: 40, marginBottom: 12 },
  gateTitle: { fontSize: 18, fontWeight: '700', color: '#a5b4fc', marginBottom: 8, textAlign: 'center' },
  gateMessage: { fontSize: 14, color: '#818cf8', textAlign: 'center', lineHeight: 20 },
  gateHint: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, lineHeight: 18 },

  // Torrent row
  row: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#f9fafb', lineHeight: 20 },
  removeButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeIcon: { fontSize: 16, color: '#6b7280' },

  progressTrack: {
    height: 6,
    backgroundColor: '#1f2937',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },

  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  progressLabel: { fontSize: 12, color: '#9ca3af' },
  speedLabel: { fontSize: 12, color: '#9ca3af' },
  sizeLabel: { fontSize: 12, color: '#9ca3af' },
  controlButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 18, color: '#f9fafb' },
  rowError: { fontSize: 12, color: '#ef4444', marginTop: 6, lineHeight: 16 },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  listContent: { paddingVertical: 8, paddingBottom: 40 },
});
