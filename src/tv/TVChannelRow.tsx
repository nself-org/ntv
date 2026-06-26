/**
 * Purpose: Single channel row for the nTV 10-foot TV channel list.
 *          Extracted from TVChannelList.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   channel   — Channel to display.
 *   isActive  — Whether this is the currently playing channel.
 *   isFirst   — Whether to receive hasTVPreferredFocus on mount.
 *   onSelect  — Callback when the row is selected via D-pad.
 *
 * Outputs: D-pad-focusable channel row with logo, name, group, live dot, NOW badge.
 *
 * Constraints:
 *   - isTVSelectable={true} on the Pressable.
 *   - hasTVPreferredFocus only on the first item.
 *   - Text ≥28sp; yellow focus ring via COLORS.focusBorder.
 *   - No touch handlers — D-pad/remote only.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-channel-row
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Channel } from '../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Colors (exported so TVChannelList.tsx can reuse them in its state views)
// ---------------------------------------------------------------------------

export const COLORS = {
  bg: '#08090e',
  surface: '#12151f',
  border: '#1e2333',
  text: '#ffffff',
  muted: '#9ca3af',
  primary: '#0ea5e9',
  focusBorder: '#fbbf24',
  focusBg: 'rgba(251, 191, 36, 0.12)',
  live: '#ef4444',
  active: 'rgba(14, 165, 233, 0.25)',
};

// ---------------------------------------------------------------------------
// TVChannelRow
// ---------------------------------------------------------------------------

interface TVChannelRowProps {
  channel: Channel;
  isActive: boolean;
  isFirst: boolean;
  onSelect: (channel: Channel) => void;
}

export const TVChannelRow = React.memo(function TVChannelRow({
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
        return (
          <>
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
          </>
        );
      }}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
  rowFocused: { borderColor: COLORS.focusBorder, backgroundColor: COLORS.focusBg },
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
});
