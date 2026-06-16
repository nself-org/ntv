/**
 * Purpose: ɳTV Channel List screen — M3U/Xtream channels grouped by category in a
 *          FlashList SectionList, with search, favorites toggle, 7-state UI, and
 *          offline-first cache from useChannelList hook.
 *
 * Inputs:
 *   - No props — uses useChannelList hook for all data.
 *   - onPressChannel: navigate to player with channel URI.
 *
 * Outputs:
 *   - Tab bar category selector + FlashList channel rows.
 *   - 7 UI states: loading (skeleton), empty (add M3U CTA), error (retry),
 *     offline (cached data + banner), populated (channel list), refreshing, success.
 *
 * Constraints:
 *   - FlashList (not FlatList) for virtualization performance.
 *   - All 7 UI states per spec.
 *   - RTL: I18nManager.isRTL flips row directions.
 *   - WCAG 2.1 AA: accessible labels, contrast ≥ 4.5:1, touch target ≥ 44pt.
 *   - Offline: stale cache shown with banner; no spinner.
 *   - Empty state: "Add M3U playlist" CTA.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv channel-list-screen feature; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  Image,
  Pressable,
  ScrollView,
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#030712',
  surface: '#111827',
  border: '#1f2937',
  primary: '#0ea5e9',
  text: '#f9fafb',
  muted: '#9ca3af',
  dim: '#6b7280',
  error: '#ef4444',
  skeleton: '#1f2937',
  skeletonShimmer: '#374151',
  offline: '#f59e0b',
  live: '#ef4444',
};

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow(): React.ReactElement {
  return (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonLogo, { backgroundColor: COLORS.skeleton }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '60%', backgroundColor: COLORS.skeleton }]} />
        <View style={[styles.skeletonLine, { width: '35%', backgroundColor: COLORS.skeleton, marginTop: 4 }]} />
      </View>
    </View>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <View style={styles.skeletonContainer} accessible accessibilityLabel="Loading channels">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onAddSource: () => void;
}

function EmptyState({ onAddSource }: EmptyStateProps): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <View style={styles.centered} accessible accessibilityLabel="No M3U playlist added">
      <Text style={styles.emptyIcon}>📺</Text>
      <Text style={styles.emptyTitle}>No IPTV Sources</Text>
      <Text style={styles.emptySubtitle}>
        Add an M3U playlist URL to start watching live TV.
      </Text>
      <Pressable
        style={styles.ctaButton}
        onPress={onAddSource}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Add M3U playlist"
        hitSlop={8}
      >
        <Text style={styles.ctaText}>Add M3U Playlist</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.centered} accessible accessibilityLabel={`Error: ${message}`}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Failed to load channels</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Retry loading channels"
        hitSlop={8}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Offline banner
// ---------------------------------------------------------------------------

function OfflineBanner(): React.ReactElement {
  return (
    <View
      style={styles.offlineBanner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Offline — showing cached channels"
    >
      <Text style={styles.offlineBannerText}>
        Offline — showing cached channels
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Channel row
// ---------------------------------------------------------------------------

interface ChannelRowProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
}

const ChannelRow = React.memo(function ChannelRow({
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
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group.trim() !== '' && (
          <Text style={styles.channelGroup} numberOfLines={1}>
            {channel.group}
          </Text>
        )}
      </View>

      <View style={styles.liveIndicator} accessibilityLabel="Live" />

      <Pressable
        style={styles.favButton}
        onPress={onFavoritePress}
        accessible
        accessibilityRole="togglebutton"
        accessibilityLabel={isFavorite ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
        accessibilityState={{ checked: isFavorite }}
        hitSlop={8}
      >
        <Text style={{ fontSize: 18 }}>{isFavorite ? '❤️' : '🤍'}</Text>
      </Pressable>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Category tab bar
// ---------------------------------------------------------------------------

interface CategoryTabBarProps {
  categories: string[];
  activeCategory: string | null;
  onSelect: (cat: string | null) => void;
}

function CategoryTabBar({ categories, activeCategory, onSelect }: CategoryTabBarProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
      accessibilityRole="tablist"
    >
      <Pressable
        style={[styles.tab, activeCategory === null && styles.tabActive]}
        onPress={() => onSelect(null)}
        accessible
        accessibilityRole="tab"
        accessibilityLabel="All categories"
        accessibilityState={{ selected: activeCategory === null }}
      >
        <Text style={[styles.tabText, activeCategory === null && styles.tabTextActive]}>
          All
        </Text>
      </Pressable>

      {categories.map((cat) => (
        <Pressable
          key={cat}
          style={[styles.tab, activeCategory === cat && styles.tabActive]}
          onPress={() => onSelect(cat)}
          accessible
          accessibilityRole="tab"
          accessibilityLabel={cat}
          accessibilityState={{ selected: activeCategory === cat }}
        >
          <Text
            style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}
            numberOfLines={1}
          >
            {cat || 'Uncategorized'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface ChannelListScreenProps {
  /** Called when user navigates to settings to add M3U source. */
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

  // Derive offline state: cache exists but network error
  const isOffline =
    error !== null &&
    error.message?.toLowerCase().includes('network') &&
    channels.length > 0;

  // Categories from sections
  const categories = useMemo(
    () => sections.map((s: ChannelSection) => s.title),
    [sections],
  );

  // Filtered channels for the active category
  const displayedChannels = useMemo<Channel[]>(() => {
    if (activeCategory === null) {
      return channels;
    }
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

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  // State 1: Loading (no cached data yet)
  if (loading && channels.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  // State 2: Error (no cached data)
  if (error !== null && channels.length === 0 && !hasNoSources) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <ErrorState message={error.message} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  // State 3: Empty (no sources configured)
  if (hasNoSources && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header search={search} onSearch={setSearch} />
        <EmptyState onAddSource={handleAddSource} />
      </SafeAreaView>
    );
  }

  // States 4-7: Populated / offline / refreshing / search results
  return (
    <SafeAreaView style={styles.container}>
      <Header search={search} onSearch={setSearch} />

      {/* State 5: Offline banner over populated list */}
      {isOffline && <OfflineBanner />}

      {/* Category tabs */}
      {categories.length > 1 && (
        <CategoryTabBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      )}

      {/* State 4: Empty category (no channels in this group) */}
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

// ---------------------------------------------------------------------------
// Header subcomponent
// ---------------------------------------------------------------------------

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
        placeholderTextColor={COLORS.dim}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessible
        accessibilityLabel="Search channels"
        accessibilityRole="search"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Tab bar
  tabBar: { maxHeight: 44, flexShrink: 0 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  // Channel row
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
  logoPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  rowContent: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  channelGroup: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.live,
    marginHorizontal: 10,
  },
  favButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Skeleton
  skeletonContainer: { paddingTop: 8 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 64,
  },
  skeletonLogo: { width: 44, height: 44, borderRadius: 6, marginEnd: 12 },
  skeletonContent: { flex: 1 },
  skeletonLine: { height: 12, borderRadius: 6 },

  // Centered states
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  ctaButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  errorMessage: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Offline banner
  offlineBanner: {
    backgroundColor: COLORS.offline,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { fontSize: 13, fontWeight: '600', color: '#000' },
});
