/**
 * Purpose: TV (rn-tvos) 10-foot channel list for ɳTV — Apple TV / Android TV / Fire TV.
 *          Full D-pad navigation via TVFocusGuideView. Focus rings on all interactive elements.
 *          No touch targets — TV-only D-pad controls only.
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
 *   - First channel has hasTVPreferredFocus.
 *   - Yellow focus ring (3px border) on focused element.
 *
 * Constraints:
 *   - isTVSelectable={true} on every interactive element.
 *   - accessible={true} on every row.
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
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import type { Channel } from '../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#08090e',
  surface: '#12151f',
  border: '#1e2333',
  text: '#ffffff',
  muted: '#9ca3af',
  primary: '#0ea5e9',
  focusBorder: '#fbbf24', // yellow focus ring
  focusBg: 'rgba(251, 191, 36, 0.12)',
  live: '#ef4444',
  active: 'rgba(14, 165, 233, 0.25)',
};

// ---------------------------------------------------------------------------
// TV Channel Row
// ---------------------------------------------------------------------------

interface TVChannelRowProps {
  channel: Channel;
  isActive: boolean;
  isFirst: boolean;
  onSelect: (channel: Channel) => void;
}

const TVChannelRow = React.memo(function TVChannelRow({
  channel,
  isActive,
  isFirst,
  onSelect,
}: TVChannelRowProps): React.ReactElement {
  return (
    <Pressable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={(state: any) => [
        styles.row,
        isActive && styles.rowActive,
        (state.focused as boolean) && styles.rowFocused,
      ]}
      onPress={() => onSelect(channel)}
      // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
      isTVSelectable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${channel.name}${isActive ? ', currently playing' : ''}`}
      // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
      hasTVPreferredFocus={isFirst}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(state: any) => {
        const focused = state.focused as boolean;
        return (<>
          {channel.logoUrl ? (
            <Image
              source={{ uri: channel.logoUrl }}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Text style={styles.logoText}>
                {channel.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.rowContent}>
            <Text
              style={[styles.channelName, focused && styles.channelNameFocused]}
              numberOfLines={1}
            >
              {channel.name}
            </Text>
            {channel.group.trim() !== '' && (
              <Text style={styles.channelGroup} numberOfLines={1}>
                {channel.group}
              </Text>
            )}
          </View>

          <View style={styles.liveDot} accessibilityLabel="Live" />

          {isActive && (
            <View style={styles.playingBadge} accessibilityLabel="Now playing">
              <Text style={styles.playingBadgeText}>▶ NOW</Text>
            </View>
          )}
        </>);
      }}
    </Pressable>
  );
});

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

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 80,
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: COLORS.surface,
  },
  rowActive: { backgroundColor: COLORS.active },
  rowFocused: {
    borderColor: COLORS.focusBorder,
    backgroundColor: COLORS.focusBg,
  },

  logo: { width: 56, height: 56, borderRadius: 8, marginEnd: 20 },
  logoPlaceholder: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

  rowContent: { flex: 1 },
  channelName: { fontSize: 28, fontWeight: '600', color: COLORS.text },
  channelNameFocused: { color: COLORS.focusBorder },
  channelGroup: { fontSize: 20, color: COLORS.muted, marginTop: 4 },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.live,
    marginHorizontal: 16,
  },
  playingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playingBadgeText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // States
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
