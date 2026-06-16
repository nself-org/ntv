/**
 * Purpose: Slide-in channel list panel for nTV Apple TV / Android TV.
 *          Slides in from the right over the player when 'up' is pressed on the remote.
 *          Shows a vertically scrollable FlatList of channels with TV-focus navigation.
 *          Selecting a channel calls onSelectChannel(channel) and closes the panel.
 *
 * Inputs:
 *   - visible: boolean — controls animated slide-in/out
 *   - channels: Channel[] — list to display
 *   - activeChannelId: string | null — currently playing channel (highlighted)
 *   - onSelectChannel: (channel: Channel) => void — called on 'select' remote button
 *   - onClose: () => void — called on 'menu' remote button
 *   - onOpenEPG: () => void — called on second 'up' to open EPG panel
 *   - loading: boolean — shows loading indicator
 *
 * Outputs: Absolute overlay React element, animated from right.
 *
 * Constraints:
 *   - TV-only: all interaction via D-pad / Siri Remote.
 *   - hasTVPreferredFocus on first item so focus lands there on open.
 *   - 'menu' (tvOS) = 'back' (Android TV) — both close the panel.
 *   - Text size ≥24pt for TV readability at 3m distance.
 *   - No touch handlers anywhere in this component.
 *   - Panel width ~35% of screen; translucent background; no safe-area padding.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel+EPG status (T-P3-E4-W2-S5-T03)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TVEventHandler,
  View,
} from 'react-native';
import type { Channel } from '../../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = Math.round(Dimensions.get('window').width * 0.35);
const SLIDE_DURATION_MS = 220;

// TV color palette (dark, high-contrast, 3m readability)
const COLORS = {
  panelBg: 'rgba(10, 14, 26, 0.96)',
  headerBg: 'rgba(5, 8, 18, 0.98)',
  itemBg: 'rgba(255, 255, 255, 0.04)',
  itemFocusBg: 'rgba(229, 9, 20, 0.85)',   // nTV red on focus
  itemActiveBorder: '#E50914',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  liveIndicator: '#E50914',
  divider: 'rgba(255, 255, 255, 0.08)',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelListPanelProps = {
  visible: boolean;
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onClose: () => void;
  onOpenEPG: () => void;
  loading?: boolean;
};

// ---------------------------------------------------------------------------
// Channel Item
// ---------------------------------------------------------------------------

type ChannelItemProps = {
  channel: Channel;
  isActive: boolean;
  isFirst: boolean;
  onSelect: (channel: Channel) => void;
};

function ChannelItem({ channel, isActive, isFirst, onSelect }: ChannelItemProps) {
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
      // hasTVPreferredFocus on first item — remote focus lands here when panel opens
      hasTVPreferredFocus={isFirst}
      accessible
      accessibilityLabel={`${channel.name}${isActive ? ', currently playing' : ''}`}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.channelLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText} numberOfLines={1}>
              {channel.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Live indicator dot */}
        <View style={styles.liveDot} />
      </View>

      {/* Channel name */}
      <View style={styles.channelInfo}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group ? (
          <Text style={styles.channelGroup} numberOfLines={1}>
            {channel.group}
          </Text>
        ) : null}
      </View>

      {/* Active indicator */}
      {isActive ? <View style={styles.activeIndicator} /> : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Panel Component
// ---------------------------------------------------------------------------

/**
 * Channel list panel: slides in from the right over the player.
 * TVEventHandler inside catches 'menu' to close and 'up' to open EPG.
 * Panel is only active when visible=true.
 */
export function ChannelListPanel({
  visible,
  channels,
  activeChannelId,
  onSelectChannel,
  onClose,
  onOpenEPG,
  loading = false,
}: ChannelListPanelProps) {
  // Animated translation (off-screen right = +PANEL_WIDTH, on-screen = 0)
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const prevUpPressRef = useRef(false);

  // Slide in/out on visibility change
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  // TVEventHandler: only active when panel is visible
  useEffect(() => {
    if (!Platform.isTV || !visible) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      switch (evt.eventType) {
        // 'menu' on tvOS / 'back' on Android TV — close panel
        case 'menu':
          onClose();
          break;

        // Second 'up' from channel list → open EPG
        case 'up':
          if (prevUpPressRef.current) {
            prevUpPressRef.current = false;
            onOpenEPG();
          } else {
            prevUpPressRef.current = true;
            // Reset after brief window so a single 'up' doesn't linger
            setTimeout(() => {
              prevUpPressRef.current = false;
            }, 600);
          }
          break;

        default:
          break;
      }
    });

    return () => {
      handler.disable();
    };
  }, [visible, onClose, onOpenEPG]);

  const renderItem = useCallback(
    ({ item, index }: { item: Channel; index: number }) => (
      <ChannelItem
        channel={item}
        isActive={item.id === activeChannelId}
        isFirst={index === 0}
        onSelect={onSelectChannel}
      />
    ),
    [activeChannelId, onSelectChannel],
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  return (
    <Animated.View
      style={[
        styles.panel,
        { transform: [{ translateX }] },
        // Hide from accessibility when not visible
        !visible && styles.panelHidden,
      ]}
      // Prevent focus from leaving to player when panel is open
      isTVSelectable={visible}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <Text style={styles.headerHint}>↑ EPG  •  Menu to close</Text>
      </View>

      {/* Channel list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading channels…</Text>
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No channels found.</Text>
          <Text style={styles.emptyHint}>Add an M3U source in Settings.</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          // TV: remove initial scroll animation for instant landing
          initialNumToRender={12}
          maxToRenderPerBatch={20}
          removeClippedSubviews={false}
        />
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: COLORS.panelBg,
    // Subtle left border for visual separation from player
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
  },
  panelHidden: {
    // Keep panel in DOM but outside focus tree when not visible
    pointerEvents: 'none',
  },
  header: {
    paddingTop: 36,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,           // ≥24pt requirement
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerHint: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyHint: {
    color: COLORS.textSecondary,
    fontSize: 22,
    textAlign: 'center',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: COLORS.itemBg,
    minHeight: 72,            // ≥24pt item height for TV touch targets
  },
  channelItemActive: {
    borderWidth: 2,
    borderColor: COLORS.itemActiveBorder,
  },
  channelItemFocused: {
    backgroundColor: COLORS.itemFocusBg,
  },
  logoContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  channelLogo: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
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
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: COLORS.textPrimary,
    fontSize: 24,             // ≥24pt minimum for TV readability
    fontWeight: '600',
    lineHeight: 30,
  },
  channelGroup: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 2,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveIndicator,
    marginLeft: 8,
  },
  separator: {
    height: 4,
  },
});
