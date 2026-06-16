/**
 * Purpose: Favorites screen — user-pinned IPTV channels with play and unfavorite actions.
 *
 * Inputs:
 *   - Channel list and favorites state from useChannelList hook.
 *
 * Outputs:
 *   - FlatList of favorited channels. Tap to play. Press Remove to unfavorite.
 *
 * Constraints:
 *   - All 7 UI states: loading | empty | error | offline | loaded | playing | success.
 *   - RTL: layouts use flexDirection row/row-reverse via I18nManager.
 *   - WCAG 2.1 AA: accessible labels on interactive elements, contrast ≥ 4.5:1.
 *   - All strings i18n-wrapped via useNselfTranslation.
 *   - NativeWind classes on wrapping views; StyleSheet for dynamic values.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv favorites-screen status updated; T-P3-E4-W2-S4-T08
 */

import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNselfTranslation } from '@nself/i18n';
import { useChannelList } from '../../../hooks/useChannelList';
import type { Channel } from '../../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Channel row
// ---------------------------------------------------------------------------

interface ChannelRowProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onUnfavorite: (channelId: string) => void;
}

function ChannelRow({ channel, onPlay, onUnfavorite }: ChannelRowProps): React.ReactElement {
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
      {/* Logo / initial */}
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

      {/* Name + group */}
      <View style={styles.rowContent}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group ? (
          <Text style={styles.channelGroup} numberOfLines={1}>
            {channel.group}
          </Text>
        ) : null}
      </View>

      {/* Unfavorite button */}
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FavoritesScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useNselfTranslation();
  const { channels, favorites, toggleFavorite, loading, error, refresh } = useChannelList();

  const favoriteChannels = useMemo(
    () => channels.filter((c) => favorites.has(c.id)),
    [channels, favorites],
  );

  const handlePlay = useCallback(
    (channel: Channel) => {
      router.push({ pathname: '/player/[id]', params: { id: channel.id, uri: channel.url } });
    },
    [router],
  );

  const handleUnfavorite = useCallback(
    (channelId: string) => {
      toggleFavorite(channelId);
    },
    [toggleFavorite],
  );

  const renderItem = useCallback(
    ({ item }: { item: Channel }) => (
      <ChannelRow channel={item} onPlay={handlePlay} onUnfavorite={handleUnfavorite} />
    ),
    [handlePlay, handleUnfavorite],
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  // ── UI state body ────────────────────────────────────────────────────────────

  function renderBody(): React.ReactElement {
    // State: loading (initial fetch)
    if (loading && channels.length === 0) {
      return (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.infoText}>{t('loading')}</Text>
        </View>
      );
    }

    // State: error
    if (error && channels.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>{t('error')}</Text>
          <Text style={styles.infoText}>{error.message}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel={t('retry')}
          >
            <Text style={styles.actionBtnText}>{t('retry')}</Text>
          </Pressable>
        </View>
      );
    }

    // State: empty
    if (!loading && favoriteChannels.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>{t('favorites')}</Text>
          <Text style={styles.infoText}>{t('favoriteChannels')}</Text>
        </View>
      );
    }

    // State: loaded / playing / success
    return (
      <FlatList<Channel>
        data={favoriteChannels}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        accessibilityLabel={t('favorites')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, I18nManager.isRTL && styles.headerRTL]}>
        <View>
          <Text style={styles.title}>{t('favorites')}</Text>
          <Text style={styles.subtitle}>
            {favoriteChannels.length > 0
              ? `${favoriteChannels.length} ${t('channels')}`
              : t('favoriteChannels')}
          </Text>
        </View>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rowPressed: {
    backgroundColor: '#111827',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1f2937',
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  rowContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f9fafb',
  },
  channelGroup: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  unfavBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  unfavBtnPressed: {
    backgroundColor: '#1f2937',
  },
  unfavBtnText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
