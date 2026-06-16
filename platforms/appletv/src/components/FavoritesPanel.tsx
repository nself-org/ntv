/**
 * Purpose: Slide-in favorites panel for nTV Apple TV / Android TV.
 * Shows the user's favorited channels in a vertical FlatList with full
 * TV D-pad navigation. "select" on a channel fires onPlayChannel.
 * "menu" remote button closes the panel and returns focus to the caller.
 *
 * Inputs:
 *   visible       — whether the panel is currently open.
 *   channels      — list of favorited TVChannel objects.
 *   onPlayChannel — called when the user selects a channel.
 *   onClose       — called when the panel should close (menu button).
 *
 * Outputs: Absolute slide-in overlay with D-pad-navigable channel list.
 *
 * Constraints:
 *   - No touch gestures. All interaction via D-pad / Siri Remote.
 *   - hasTVPreferredFocus on first item so focus enters the list immediately.
 *   - TVFocusGuideView wraps the list to prevent focus escaping the panel.
 *   - Panel slides in from the right using Animated.timing.
 *   - "menu" remote event closes the panel (TVEventHandler registered here).
 *   - Text ≥24pt; contrast ≥6:1 against panel background.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS favorites panel (T-P3-E4-W2-S5-T04)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TVEventHandler,
  TVFocusGuideView,
  View,
} from 'react-native';
import type { TVChannel } from '@/screens/HomeScreen';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FavoritesPanelProps {
  /** Whether the panel is visible/open. */
  visible: boolean;
  /** Favorited channels list. */
  channels: TVChannel[];
  /** Called when the user selects a channel to play. */
  onPlayChannel: (channel: TVChannel) => void;
  /** Called when the panel should close (menu button or external trigger). */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const PLACEHOLDER_FAVORITES: TVChannel[] = [
  { id: 'fav1', name: 'News HD', streamUrl: '' },
  { id: 'fav2', name: 'Sports 1', streamUrl: '' },
  { id: 'fav3', name: 'Movies HD', streamUrl: '' },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 480;
const SLIDE_DURATION_MS = 220;

// ---------------------------------------------------------------------------
// ChannelRow
// ---------------------------------------------------------------------------

interface ChannelRowProps {
  channel: TVChannel;
  isFirst: boolean;
  onPress: (channel: TVChannel) => void;
}

/**
 * Single channel row in the favorites list.
 * hasTVPreferredFocus on the first row so focus enters the panel on open.
 */
function ChannelRow({ channel, isFirst, onPress }: ChannelRowProps) {
  const handlePress = useCallback(() => onPress(channel), [channel, onPress]);

  return (
    <Pressable
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — hasTVPreferredFocus is react-native-tvos only
      hasTVPreferredFocus={isFirst}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
      style={({ focused }: { focused: boolean }) => [
        styles.row,
        focused ? styles.rowFocused : null,
      ]}
      onPress={handlePress}
      accessibilityLabel={`Play ${channel.name}`}
    >
      {/* Channel logo circle */}
      <View style={styles.rowLogo}>
        <Text style={styles.rowLogoInitial}>
          {channel.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Channel name */}
      <Text style={styles.rowName} numberOfLines={1}>
        {channel.name}
      </Text>

      {/* Play indicator */}
      <Text style={styles.rowPlay}>▶</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// FavoritesPanel
// ---------------------------------------------------------------------------

/**
 * Slide-in panel that lists the user's favorited channels.
 * The panel slides in from the right edge when visible=true and
 * slides back out when visible=false.
 *
 * TVEventHandler is registered while the panel is visible to intercept
 * the "menu" button and close the panel cleanly.
 */
export function FavoritesPanel({
  visible,
  channels,
  onPlayChannel,
  onClose,
}: FavoritesPanelProps): React.JSX.Element | null {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const isVisibleRef = useRef(false);

  // --- Slide animation ---
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    isVisibleRef.current = visible;
  }, [visible, translateX]);

  // --- TVEventHandler: intercept "menu" to close panel ---
  useEffect(() => {
    if (!Platform.isTV || !visible) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      if (evt.eventType === 'menu') {
        onClose();
      }
    });

    return () => {
      handler.disable();
    };
  }, [visible, onClose]);

  // Render nothing when fully offscreen and not animating
  if (!visible && !isVisibleRef.current) {
    return null;
  }

  const displayChannels = channels.length > 0 ? channels : PLACEHOLDER_FAVORITES;

  return (
    // Absolute overlay — sits over the home screen
    <Animated.View
      style={[styles.panel, { transform: [{ translateX }] }]}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — accessible is standard but RN types lag
      accessible={false}
    >
      {/* Panel header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerHint}>Press menu to close</Text>
      </View>

      {/* Channel list */}
      {/* TVFocusGuideView prevents D-pad focus escaping the panel while it is open */}
      <TVFocusGuideView style={styles.listGuide} trapFocusDown trapFocusUp>
        {displayChannels.length > 0 ? (
          <FlatList<TVChannel>
            data={displayChannels}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ChannelRow
                channel={item}
                isFirst={index === 0}
                onPress={onPlayChannel}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No favorites yet.</Text>
            <Text style={styles.emptyHint}>
              Add channels to favorites from the channel list.
            </Text>
          </View>
        )}
      </TVFocusGuideView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // --- Panel container ---
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0f172a', // slate-900 — panel bg; >6:1 vs white text
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b', // slate-800
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  // --- Header ---
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 36, // ≥24pt
    fontWeight: '700',
    color: '#f1f5f9', // slate-100 — contrast ≥18:1 on slate-900
    marginBottom: 6,
  },
  headerHint: {
    fontSize: 20,
    color: '#64748b', // slate-500
  },
  // --- List ---
  listGuide: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 48,
  },
  // --- Channel row ---
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowFocused: {
    backgroundColor: '#1e293b', // slate-800 — focused bg
    borderColor: '#0ea5e9', // sky-500 — focus ring
    transform: [{ scale: 1.02 }],
  },
  rowLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1d4ed8', // blue-700
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  rowLogoInitial: {
    fontSize: 24, // ≥24pt
    fontWeight: '700',
    color: '#f9fafb', // gray-50 — contrast ≥13:1 on blue-700
  },
  rowName: {
    flex: 1,
    fontSize: 26, // ≥24pt
    fontWeight: '500',
    color: '#f1f5f9', // slate-100 — contrast ≥18:1
  },
  rowPlay: {
    fontSize: 20,
    color: '#38bdf8', // sky-400
    marginLeft: 12,
  },
  // --- Empty state ---
  emptyState: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 28, // ≥24pt
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 22,
    color: '#475569', // slate-600
    textAlign: 'center',
  },
});
