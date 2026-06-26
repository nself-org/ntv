/**
 * Purpose: ChannelItem sub-component for the nTV Apple TV channel list panel.
 *          Extracted from ChannelListPanel.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   channel   — Channel to display.
 *   isActive  — Whether this is the currently playing channel.
 *   isFirst   — Whether to receive hasTVPreferredFocus on mount.
 *   onSelect  — Called when the user presses select on the remote.
 *
 * Outputs: Pressable TV-focusable channel row with logo, name, group, live dot.
 *
 * Constraints:
 *   - TV-only: all interaction via D-pad / Siri Remote.
 *   - Text ≥24pt; high-contrast palette for 3m readability.
 *   - hasTVPreferredFocus only on the first item (when panel opens).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel list panel item
 */

import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Channel } from '../../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Colors (shared with panel — keep in sync)
// ---------------------------------------------------------------------------

export const COLORS = {
  panelBg: 'rgba(10, 14, 26, 0.96)',
  headerBg: 'rgba(5, 8, 18, 0.98)',
  itemBg: 'rgba(255, 255, 255, 0.04)',
  itemFocusBg: 'rgba(229, 9, 20, 0.85)',
  itemActiveBorder: '#E50914',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  liveIndicator: '#E50914',
  divider: 'rgba(255, 255, 255, 0.08)',
};

// ---------------------------------------------------------------------------
// ChannelItem
// ---------------------------------------------------------------------------

export type ChannelItemProps = {
  channel: Channel;
  isActive: boolean;
  isFirst: boolean;
  onSelect: (channel: Channel) => void;
};

export function ChannelItem({ channel, isActive, isFirst, onSelect }: ChannelItemProps) {
  const handlePress = useCallback(() => {
    onSelect(channel);
  }, [channel, onSelect]);

  return (
    <Pressable
      style={({ pressed, focused }) => [
        styles.channelItem,
        isActive && styles.channelItemActive,
        (focused || pressed) && styles.channelItemFocused,
      ]}
      onPress={handlePress}
      // hasTVPreferredFocus on first item so remote focus lands here on panel open
      hasTVPreferredFocus={isFirst}
      accessible
      accessibilityLabel={`${channel.name}${isActive ? ', currently playing' : ''}`}
    >
      <View style={styles.logoContainer}>
        {channel.logoUrl ? (
          <Image source={{ uri: channel.logoUrl }} style={styles.channelLogo} resizeMode="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText} numberOfLines={1}>
              {channel.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.liveDot} />
      </View>

      <View style={styles.channelInfo}>
        <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
        {channel.group ? (
          <Text style={styles.channelGroup} numberOfLines={1}>{channel.group}</Text>
        ) : null}
      </View>

      {isActive ? <View style={styles.activeIndicator} /> : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: COLORS.itemBg,
    minHeight: 72,
  },
  channelItemActive: { borderWidth: 2, borderColor: COLORS.itemActiveBorder },
  channelItemFocused: { backgroundColor: COLORS.itemFocusBg },
  logoContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  channelLogo: { width: 48, height: 48, borderRadius: 6 },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.liveIndicator,
    borderWidth: 1.5,
    borderColor: COLORS.panelBg,
  },
  channelInfo: { flex: 1 },
  channelName: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '600', lineHeight: 30 },
  channelGroup: { color: COLORS.textSecondary, fontSize: 18, marginTop: 2 },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveIndicator,
    marginLeft: 8,
  },
});
