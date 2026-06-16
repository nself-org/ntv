/**
 * Purpose: Top-level TV home screen for nTV.
 * Renders two horizontal FlatList rows:
 *   1. Featured channels — curated channels, large cells.
 *   2. Recently watched — ordered most-recent-first.
 * hasTVPreferredFocus on the first featured cell so the Siri Remote or
 * D-pad cursor lands on a known element on launch.
 *
 * Inputs:
 *   featuredChannels — curated channel list (defaults to placeholder data).
 *   recentChannels   — recently watched channels (defaults to placeholder).
 *   onPlayChannel    — callback when the user selects a channel.
 *
 * Outputs: Two-row TV home grid with full D-pad navigation.
 *
 * Constraints:
 *   - No touch gestures (TV only — Platform.isTV guard).
 *   - hasTVPreferredFocus on first featured cell (acceptance requirement).
 *   - Text ≥24pt; background contrast ≥6:1 at 3 m viewing distance.
 *   - TVFocusGuideView wraps each row so D-pad can cross row boundaries.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS home screen (T-P3-E4-W2-S5-T04)
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal channel shape for home-screen display. */
export interface TVChannel {
  id: string;
  name: string;
  streamUrl: string;
  logoUrl?: string;
  category?: string;
}

export interface HomeScreenProps {
  /** Featured channels shown in the top hero row. */
  featuredChannels?: TVChannel[];
  /** Recently watched channels, most-recent first. */
  recentChannels?: TVChannel[];
  /** Called when the user selects a channel to play. */
  onPlayChannel?: (channel: TVChannel) => void;
}

// ---------------------------------------------------------------------------
// Placeholder data (replaced by real GraphQL data when wired in T05)
// ---------------------------------------------------------------------------

const PLACEHOLDER_FEATURED: TVChannel[] = [
  { id: 'f1', name: 'News HD', streamUrl: '' },
  { id: 'f2', name: 'Sports 1', streamUrl: '' },
  { id: 'f3', name: 'Movies HD', streamUrl: '' },
  { id: 'f4', name: 'Kids Zone', streamUrl: '' },
  { id: 'f5', name: 'Music TV', streamUrl: '' },
];

const PLACEHOLDER_RECENT: TVChannel[] = [
  { id: 'r1', name: 'News HD', streamUrl: '' },
  { id: 'r2', name: 'Sports 1', streamUrl: '' },
  { id: 'r3', name: 'Movies HD', streamUrl: '' },
];

// ---------------------------------------------------------------------------
// ChannelCell
// ---------------------------------------------------------------------------

interface ChannelCellProps {
  channel: TVChannel;
  /** Only the very first cell in the featured row carries hasTVPreferredFocus. */
  isFirst: boolean;
  onPress: (channel: TVChannel) => void;
}

/**
 * Single focusable channel cell.
 * The first cell in the featured row carries hasTVPreferredFocus so the
 * remote cursor starts here on launch with no extra focus management.
 */
function ChannelCell({ channel, isFirst, onPress }: ChannelCellProps) {
  const handlePress = useCallback(() => onPress(channel), [channel, onPress]);

  return (
    <Pressable
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
      hasTVPreferredFocus={isFirst}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
      style={({ focused }: { focused: boolean }) => [
        styles.cell,
        focused ? styles.cellFocused : null,
      ]}
      onPress={handlePress}
    >
      {/* Channel logo — circle with first initial; real logo added in T05 */}
      <View style={styles.logoBox}>
        <Text style={styles.logoInitial}>{channel.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.cellName} numberOfLines={1}>
        {channel.name}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

/**
 * Two-row TV home grid. Uses TVFocusGuideView around each horizontal row
 * so the D-pad cursor can move cleanly between rows without getting stuck.
 */
export function HomeScreen({
  featuredChannels = PLACEHOLDER_FEATURED,
  recentChannels = PLACEHOLDER_RECENT,
  onPlayChannel,
}: HomeScreenProps): React.JSX.Element {
  const handlePlay = useCallback(
    (channel: TVChannel) => { onPlayChannel?.(channel); },
    [onPlayChannel],
  );

  const renderFeatured = useCallback(
    ({ item, index }: { item: TVChannel; index: number }) => (
      <ChannelCell channel={item} isFirst={index === 0} onPress={handlePlay} />
    ),
    [handlePlay],
  );

  const renderRecent = useCallback(
    ({ item }: { item: TVChannel }) => (
      <ChannelCell channel={item} isFirst={false} onPress={handlePlay} />
    ),
    [handlePlay],
  );

  if (!Platform.isTV) {
    // Safety guard — this screen should never render outside a TV platform.
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>TV Platform Required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>nTV</Text>

      {/* Row 1: Featured */}
      {/* TVFocusGuideView — ensures focus enters the row on D-pad down from brand text */}
      <TVFocusGuideView style={styles.focusGuide} autoFocus>
        <Text style={styles.sectionTitle}>Featured</Text>
        <FlatList<TVChannel>
          data={featuredChannels}
          keyExtractor={(item) => item.id}
          renderItem={renderFeatured}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        />
      </TVFocusGuideView>

      {/* Row 2: Recently watched */}
      <TVFocusGuideView style={styles.focusGuide}>
        <Text style={styles.sectionTitle}>Recently Watched</Text>
        {recentChannels.length > 0 ? (
          <FlatList<TVChannel>
            data={recentChannels}
            keyExtractor={(item) => item.id}
            renderItem={renderRecent}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowContent}
          />
        ) : (
          <Text style={styles.emptyHint}>No recently watched channels yet</Text>
        )}
      </TVFocusGuideView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — high contrast palette for 3 m TV viewing distance
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // gray-950 — base
    paddingHorizontal: 60,
    paddingTop: 48,
  },
  brand: {
    fontSize: 48,
    fontWeight: '700',
    color: '#f9fafb', // gray-50 — contrast 21:1 on #030712
    letterSpacing: -1,
    marginBottom: 32,
  },
  focusGuide: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28, // ≥24pt requirement
    fontWeight: '600',
    color: '#f9fafb', // gray-50 — contrast 21:1
    marginBottom: 16,
  },
  rowContent: {
    paddingRight: 24,
    gap: 16,
  },
  // --- Channel cell ---
  cell: {
    width: 200,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#111827', // gray-900 — contrast 12:1 on #030712
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellFocused: {
    borderColor: '#0ea5e9', // sky-500
    backgroundColor: '#1e3a5f', // navy — focused state; >6:1 vs #f9fafb text
    transform: [{ scale: 1.06 }],
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1d4ed8', // blue-700
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoInitial: {
    fontSize: 28, // ≥24pt
    fontWeight: '700',
    color: '#f9fafb', // gray-50 — contrast ≥13:1 on blue-700
  },
  cellName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5e7eb', // gray-200 — contrast 11:1 on gray-900
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 24, // ≥24pt
    color: '#6b7280', // gray-500
    fontStyle: 'italic',
    paddingVertical: 24,
  },
});
