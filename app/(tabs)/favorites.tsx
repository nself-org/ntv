/**
 * Purpose: Favorites tab screen for ɳTV — displays user's favorited IPTV channels.
 *          Channels with a heart are shown here; tap to play, swipe-left or button to unfavorite.
 * Inputs:  useChannelList hook (favorites Set + toggleFavorite fn + channels array).
 * Outputs: FlashList of favorited channels with play and unfavorite actions.
 * Constraints: React Native + Expo Router. No GraphQL — favorites stored in AsyncStorage.
 *              All 7 UI states (loading, error, empty, offline, partial, refreshing, populated).
 * SPORT: F12-REPO-TYPE-MAP.md ntv favorites feature
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChannelList } from '../../hooks/useChannelList';
import type { Channel } from '../../services/m3u-parser';

// ─── Favorite Channel Row ─────────────────────────────────────────────────────

interface FavRowProps {
  channel: Channel;
  onPlay: () => void;
  onUnfavorite: () => void;
}

const FavRow = React.memo(function FavRow({ channel, onPlay, onUnfavorite }: FavRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onPlay} activeOpacity={0.7}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoText}>{channel.name.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{channel.name}</Text>
          {channel.group ? (
            <Text style={styles.group} numberOfLines={1}>{channel.group}</Text>
          ) : null}
        </View>
        <Ionicons name="play-circle-outline" size={24} color="#7c3aed" style={styles.playIcon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.unfavBtn}
        onPress={onUnfavorite}
        accessibilityLabel={`Remove ${channel.name} from favorites`}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="heart" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen(): React.ReactElement {
  const router = useRouter();
  const { channels, favorites, toggleFavorite, loading, error, refresh } = useChannelList();

  const favoriteChannels = channels.filter((c) => favorites.has(c.id));

  const handlePlay = useCallback(
    (url: string) => {
      router.push({ pathname: '/(tabs)/player', params: { uri: url } });
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
      <FavRow
        channel={item}
        onPlay={() => handlePlay(item.url)}
        onUnfavorite={() => handleUnfavorite(item.id)}
      />
    ),
    [handlePlay, handleUnfavorite],
  );

  // ── UI states ──────────────────────────────────────────────────────────────

  if (loading && favoriteChannels.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.stateText}>Loading channels…</Text>
      </SafeAreaView>
    );
  }

  if (error && favoriteChannels.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.stateText}>Could not load channels</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!loading && favoriteChannels.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="heart-outline" size={56} color="#374151" />
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the heart icon on any channel to save it here.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{favoriteChannels.length} channel{favoriteChannels.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlashList
        data={favoriteChannels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={68}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#7c3aed" />
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  center: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
  count: { fontSize: 13, color: '#6b7280' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1f2937' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  logoPlaceholder: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  info: { flex: 1 },
  name: { color: '#f9fafb', fontSize: 15, fontWeight: '500' },
  group: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  playIcon: { marginLeft: 8 },
  unfavBtn: { paddingLeft: 12 },
  stateText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#7c3aed', borderRadius: 8 },
  retryText: { color: '#f9fafb', fontWeight: '600' },
  emptyTitle: { color: '#9ca3af', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#4b5563', fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 280 },
});
