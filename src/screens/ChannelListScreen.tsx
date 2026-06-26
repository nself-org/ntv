/**
 * Purpose: ɳTV Channel List screen — M3U/Xtream channels grouped by category in a
 *          FlashList SectionList, with search, favorites toggle, 7-state UI, and
 *          offline-first cache from useChannelList hook.
 *
 * Inputs:
 *   - No props — uses useChannelList hook for all data.
 *   - onNavigateToSettings?: called when user should navigate to settings.
 *
 * Outputs:
 *   - Header (title + search box) + category tab bar + FlashList channel rows.
 *   - 7 UI states: loading (skeleton), empty (add M3U CTA), error (retry),
 *     offline (cached data + banner), populated (channel list), refreshing, success.
 *
 * Constraints:
 *   - FlashList (not FlatList) for virtualization performance.
 *   - RTL: I18nManager.isRTL flips row directions.
 *   - WCAG 2.1 AA: accessible labels, contrast >= 4.5:1, touch target >= 44pt.
 *   - Offline: stale cache shown with banner; no spinner.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv channel-list-screen feature; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNselfTranslation } from '@nself/i18n';
import { useChannelList } from '../../hooks/useChannelList';
import type { Channel } from '../../services/m3u-parser';
import type { ChannelSection } from '../../hooks/useChannelList';
import { ChannelRow } from '../components/channel-list/ChannelRow';
import { CHANNEL_LIST_COLORS as C } from '../components/channel-list/ChannelListColors';
import {
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  OfflineBanner,
} from '../components/channel-list/ChannelListStates';
import { CategoryTabBar } from '../components/channel-list/CategoryTabBar';

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  search: string;
  onSearch: (q: string) => void;
}

function Header({ search, onSearch }: HeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle} accessibilityRole="header">
        ɳTV
      </Text>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={onSearch}
        placeholder="Search channels…"
        placeholderTextColor={C.dim}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessible
        accessibilityLabel="Search channels"
        accessibilityRole="search"
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

interface ChannelListScreenProps {
  /** Called when user should navigate to settings to add an M3U source. */
  onNavigateToSettings?: () => void;
}

export default function ChannelListScreen({
  onNavigateToSettings,
}: ChannelListScreenProps): React.ReactElement {
  const { t } = useNselfTranslation();
  const router = useRouter();

  const {
    sections,
    channels,
    favorites,
    search,
    setSearch,
    toggleFavorite,
    loading,
    error,
    refresh,
    m3uUrls,
    xtreamSources,
  } = useChannelList();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Derive offline state: network error while cached data is present
  const isOffline =
    error !== null &&
    error.message?.toLowerCase().includes('network') &&
    channels.length > 0;

  const categories = useMemo(
    () => sections.map((s: ChannelSection) => s.title),
    [sections],
  );

  const displayedChannels = useMemo<Channel[]>(() => {
    if (activeCategory === null) return channels;
    const sect = sections.find((s: ChannelSection) => s.title === activeCategory);
    return sect ? sect.data : [];
  }, [channels, sections, activeCategory]);

  const hasNoSources = m3uUrls.length === 0 && xtreamSources.length === 0;

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      router.push({
        pathname: '/player/[id]',
        params: {
          id: channel.id,
          uri: channel.url,
          title: channel.name,
          artwork: channel.logoUrl,
        },
      } as any);
    },
    [router],
  );

  const handleAddSource = useCallback(() => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      router.push('/(tabs)/settings' as any);
    }
  }, [onNavigateToSettings, router]);

  const renderChannel = useCallback(
    ({ item }: { item: Channel }) => (
      <ChannelRow
        channel={item}
        isFavorite={favorites.has(item.id)}
        onPress={() => handleChannelPress(item)}
        onFavoritePress={() => toggleFavorite(item.id)}
      />
    ),
    [favorites, handleChannelPress, toggleFavorite],
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  // ─── 7-state render ────────────────────────────────────────────────────────

  if (loading && channels.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (error !== null && channels.length === 0 && !hasNoSources) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <ErrorState message={error.message} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  if (hasNoSources && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <EmptyState onAddSource={handleAddSource} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header search={search} onSearch={setSearch} />

      {isOffline && <OfflineBanner />}

      {categories.length > 1 && (
        <CategoryTabBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      )}

      {displayedChannels.length === 0 && !loading ? (
        <View style={styles.centered} accessible accessibilityLabel="No channels in this category">
          <Text style={styles.emptySubtitle}>No channels in this category</Text>
        </View>
      ) : (
        <FlashList
          data={displayedChannels}
          renderItem={renderChannel}
          keyExtractor={keyExtractor}
          estimatedItemSize={64}
          onRefresh={refresh}
          refreshing={loading}
          accessible
          accessibilityLabel="Channel list"
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: C.primary, marginBottom: 8 },
  searchInput: {
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8 },
});
