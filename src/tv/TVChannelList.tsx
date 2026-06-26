/**
 * Purpose: TV (rn-tvos) 10-foot channel list for ɳTV — Apple TV / Android TV / Fire TV.
 *          TVChannelRow extracted to TVChannelRow.tsx.
 *
 * Inputs:
 *   - channels: Channel[] — list of IPTV channels
 *   - activeChannelId: string | null — currently playing channel
 *   - loading: boolean
 *   - error: Error | null
 *   - onSelectChannel: (channel: Channel) => void
 *   - onRefresh: () => void
 *
 * Outputs:
 *   - Vertically scrollable FlatList of channels with TV focus navigation.
 *   - Loading / error / empty state views.
 *
 * Constraints:
 *   - isTVSelectable={true} on every interactive element.
 *   - Text min 28sp for TV readability at 3m.
 *   - No touch handlers — D-pad/remote only.
 *   - TVFocusGuideView wraps the list for cross-section D-pad navigation.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-channel-list-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import type { Channel } from '../../services/m3u-parser';
import { COLORS, TVChannelRow } from './TVChannelRow';

// ---------------------------------------------------------------------------
// TVChannelList
// ---------------------------------------------------------------------------

export interface TVChannelListProps {
  channels: Channel[];
  activeChannelId?: string | null;
  loading?: boolean;
  error?: Error | null;
  onSelectChannel: (channel: Channel) => void;
  onRefresh?: () => void;
}

export function TVChannelList({
  channels,
  activeChannelId = null,
  loading = false,
  error = null,
  onSelectChannel,
  onRefresh,
}: TVChannelListProps): React.ReactElement {
  const renderRow = useCallback(
    ({ item, index }: { item: Channel; index: number }) => (
      <TVChannelRow
        channel={item}
        isActive={item.id === activeChannelId}
        isFirst={index === 0}
        onSelect={onSelectChannel}
      />
    ),
    [activeChannelId, onSelectChannel],
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  // Loading state
  if (loading && channels.length === 0) {
    return (
      <View style={styles.container} accessible accessibilityLabel="Loading channels">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.stateText}>Loading channels…</Text>
      </View>
    );
  }

  // Error state
  if (error !== null && channels.length === 0) {
    return (
      <View style={styles.container} accessible accessibilityLabel={`Error: ${error.message}`}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.stateText}>Failed to load channels</Text>
        {onRefresh && (
          <Pressable
            style={styles.retryButton}
            onPress={onRefresh}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel="Retry loading channels"
            // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
            hasTVPreferredFocus
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.retryText, (s.focused as boolean) && styles.retryTextFocused]}>
                Retry
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  // Empty state
  if (channels.length === 0 && !loading) {
    return (
      <View style={styles.container} accessible accessibilityLabel="No channels available">
        <Text style={styles.stateText}>No channels available</Text>
        <Text style={styles.stateSubText}>Add an M3U source in Settings</Text>
      </View>
    );
  }

  // Populated
  return (
    <TVFocusGuideView style={styles.container} autoFocus destinations={[]}>
      <FlatList
        data={channels}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel={`Channel list, ${channels.length} channels`}
      />
    </TVFocusGuideView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flex: 1, width: '100%' },
  listContent: { paddingVertical: 16 },
  stateText: { fontSize: 28, color: COLORS.muted, marginTop: 16, textAlign: 'center' },
  stateSubText: { fontSize: 22, color: COLORS.muted, marginTop: 8, textAlign: 'center' },
  errorIcon: { fontSize: 56 },
  retryButton: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: COLORS.focusBorder,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  retryText: { fontSize: 26, color: COLORS.text, fontWeight: '600' },
  retryTextFocused: { color: COLORS.focusBorder },
});
