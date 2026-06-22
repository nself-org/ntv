/**
 * Purpose: Favorites list row for a single IPTV channel in the ɳTV favorites screen.
 *          Extracted from src/app/(tabs)/favorites.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   channel       — Channel to display.
 *   onPlay        — callback when the row is tapped.
 *   onUnfavorite  — callback to remove the channel from favorites.
 *
 * Outputs: Pressable row with logo/initial, channel name, group, and Unfavorite button.
 *
 * Constraints:
 *   - RTL: flexDirection flips via I18nManager.isRTL.
 *   - Accessibility: accessibilityRole="button", label includes channel name.
 *   - All user-visible strings go through useNselfTranslation.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv favorite-channel-row
 */

import React from 'react';
import {
  I18nManager,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNselfTranslation } from '@nself/i18n';
import type { Channel } from '../../../services/m3u-parser';

export interface FavoriteChannelRowProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onUnfavorite: (channelId: string) => void;
}

/** Tappable favorite channel row with logo, name, group, and remove button. */
export function FavoriteChannelRow({
  channel,
  onPlay,
  onUnfavorite,
}: FavoriteChannelRowProps): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        I18nManager.isRTL && styles.rowRTL,
        pressed && styles.rowPressed,
      ]}
      onPress={() => onPlay(channel)}
      accessibilityRole="button"
      accessibilityLabel={`${t('play')} ${channel.name}`}
    >
      {channel.logoUrl ? (
        <Image
          source={{ uri: channel.logoUrl }}
          style={styles.logo}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={styles.logoPlaceholder} accessibilityElementsHidden>
          <Text style={styles.logoInitial}>{channel.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.rowContent}>
        <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
        {channel.group ? (
          <Text style={styles.channelGroup} numberOfLines={1}>{channel.group}</Text>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [styles.unfavBtn, pressed && styles.unfavBtnPressed]}
        onPress={() => onUnfavorite(channel.id)}
        accessibilityRole="button"
        accessibilityLabel={`${t('delete')} ${channel.name}`}
        hitSlop={8}
      >
        <Text style={styles.unfavBtnText}>{t('delete')}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  rowPressed: { backgroundColor: '#111827' },
  logo: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#1f2937' },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: { fontSize: 18, fontWeight: '700', color: '#0ea5e9' },
  rowContent: { flex: 1, marginHorizontal: 12 },
  channelName: { fontSize: 15, fontWeight: '600', color: '#f9fafb' },
  channelGroup: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  unfavBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  unfavBtnPressed: { backgroundColor: '#1f2937' },
  unfavBtnText: { fontSize: 13, color: '#9ca3af' },
});
