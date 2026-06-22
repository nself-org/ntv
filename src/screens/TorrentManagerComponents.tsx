/**
 * Purpose: Sub-components and types for the ɳTV TorrentManager screen.
 *          Extracted from TorrentManagerScreen.tsx to keep that file under 300 lines.
 *          Contains: TorrentStatus, TorrentItem, BundleGateCard, TorrentRow,
 *                    Header, AddForm, formatBytes, extractName.
 *
 * Inputs:
 *   TorrentRow — item: TorrentItem, onPause, onResume, onRemove callbacks.
 *   AddForm    — value, onChange, onAdd, adding, error, inputRef.
 *
 * Outputs: Styled UI sub-components. No state or storage calls.
 *
 * Constraints:
 *   - WCAG 2.1 AA: accessible labels on all interactive elements.
 *   - Bundle gate card is display-only; actual gate check lives in the parent screen.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv torrent-manager-components
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { VIDEO_ERROR_MESSAGES } from '../types/video-errors';

// ---------------------------------------------------------------------------
// Types (re-exported so the screen file stays thin)
// ---------------------------------------------------------------------------

export type TorrentStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface TorrentItem {
  id: string;
  /** Original magnet or torrent URL */
  url: string;
  /** Display name — derived from magnet dn= or filename */
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
// Helpers (exported for use in the screen)
// ---------------------------------------------------------------------------

/** Extract a display name from a magnet link or torrent URL. */
export function extractName(url: string): string {
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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ---------------------------------------------------------------------------
// Bundle gate card
// ---------------------------------------------------------------------------

export function BundleGateCard(): React.ReactElement {
  return (
    <View
      style={styles.gateCard}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={VIDEO_ERROR_MESSAGES.bundle_required}
    >
      <Text style={styles.gateIcon}>🔒</Text>
      <Text style={styles.gateTitle}>ɳTV Bundle Required</Text>
      <Text style={styles.gateMessage}>{VIDEO_ERROR_MESSAGES.bundle_required}</Text>
      <Text style={styles.gateHint}>
        Upgrade in Settings › Manage Subscription to unlock downloads, recordings, and more.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function TorrentManagerHeader(): React.ReactElement {
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

export interface AddFormProps {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
  error: string | null;
  inputRef: React.RefObject<TextInput | null>;
}

export function AddForm({ value, onChange, onAdd, adding, error, inputRef }: AddFormProps): React.ReactElement {
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

export const TorrentRow = React.memo(function TorrentRow({
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

      <View style={styles.progressTrack} accessibilityLabel={`Download progress ${progressPct}%`}>
        <View
          style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: statusColor }]}
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
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },

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
});
