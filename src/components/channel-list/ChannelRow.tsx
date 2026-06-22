/**
 * Purpose: Single channel row for the ɳTV channel list — logo, name, group, live dot, favorites.
 * Inputs:
 *   - channel: Channel — the channel to display
 *   - isFavorite: boolean — current favorite state
 *   - onPress: () => void — navigate to player
 *   - onFavoritePress: () => void — toggle favorite
 * Outputs: Pressable row with RTL support.
 * Constraints: Memoized. RTL via I18nManager. WCAG: 44pt touch targets. Logo placeholder on missing URL.
 * SPORT: P4-E0-W2-S07-T01 channel-list refactor
 */

import React from 'react';
import { I18nManager, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Channel } from '../../services/m3u-parser';

const COLORS = {
  surface: '#111827',
  border: '#1f2937',
  primary: '#0ea5e9',
  text: '#f9fafb',
  muted: '#9ca3af',
  live: '#ef4444',
};

interface ChannelRowProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
}

/** Memoized channel row component for use in FlashList. */
export const ChannelRow = React.memo(function ChannelRow({
  channel,
  isFavorite,
  onPress,
  onFavoritePress,
}: ChannelRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Play ${channel.name}`}
      hitSlop={4}
    >
      {channel.logoUrl ? (
        <Image
          source={{ uri: channel.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Text style={styles.logoText} numberOfLines={1}>
            {channel.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.rowContent}>
        <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
        {channel.group.trim() !== '' && (
          <Text style={styles.channelGroup} numberOfLines={1}>{channel.group}</Text>
        )}
      </View>

      <View style={styles.liveIndicator} accessibilityLabel="Live" />

      <Pressable
        style={styles.favButton}
        onPress={onFavoritePress}
        accessible
        accessibilityRole="togglebutton"
        accessibilityLabel={
          isFavorite
            ? `Remove ${channel.name} from favorites`
            : `Add ${channel.name} to favorites`
        }
        accessibilityState={{ checked: isFavorite }}
        hitSlop={8}
      >
        <Text style={{ fontSize: 18 }}>{isFavorite ? '❤️' : '🤍'}</Text>
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowPressed: { backgroundColor: COLORS.surface },
  logo: { width: 44, height: 44, borderRadius: 6, marginEnd: 12 },
  logoPlaceholder: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  rowContent: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  channelGroup: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.live, marginHorizontal: 10 },
  favButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
