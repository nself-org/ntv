/**
 * Purpose: Slide-in channel list panel for nTV Apple TV / Android TV.
 *          Slides in from the right over the player when 'up' is pressed on the remote.
 *          ChannelItem extracted to ChannelListPanelItem.tsx.
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
 *   - 'menu' (tvOS) = 'back' (Android TV) — both close the panel.
 *   - Text size ≥24pt for TV readability at 3m distance.
 *   - No touch handlers anywhere in this component.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel+EPG status (T-P3-E4-W2-S5-T03)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TVEventHandler,
  View,
} from 'react-native';
import type { Channel } from '../../../services/m3u-parser';
import { ChannelItem, COLORS } from './ChannelListPanelItem';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = Math.round(Dimensions.get('window').width * 0.35);
const SLIDE_DURATION_MS = 220;

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
// ChannelListPanel
// ---------------------------------------------------------------------------

export function ChannelListPanel({
  visible,
  channels,
  activeChannelId,
  onSelectChannel,
  onClose,
  onOpenEPG,
  loading = false,
}: ChannelListPanelProps) {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const prevUpPressRef = useRef(false);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  useEffect(() => {
    if (!Platform.isTV || !visible) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      switch (evt.eventType) {
        case 'menu':
          onClose();
          break;

        case 'up':
          if (prevUpPressRef.current) {
            prevUpPressRef.current = false;
            onOpenEPG();
          } else {
            prevUpPressRef.current = true;
            setTimeout(() => { prevUpPressRef.current = false; }, 600);
          }
          break;

        default:
          break;
      }
    });

    return () => { handler.disable(); };
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
      style={[styles.panel, { transform: [{ translateX }] }, !visible && styles.panelHidden]}
      isTVSelectable={visible}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <Text style={styles.headerHint}>↑ EPG  •  Menu to close</Text>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Loading channels…</Text>
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.stateContainer}>
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
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
  },
  panelHidden: { pointerEvents: 'none' },
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
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  headerHint: { color: COLORS.textSecondary, fontSize: 18 },
  list: { flex: 1 },
  listContent: { paddingVertical: 8 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stateText: { color: COLORS.textSecondary, fontSize: 24 },
  emptyText: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '600', marginBottom: 12 },
  emptyHint: { color: COLORS.textSecondary, fontSize: 22, textAlign: 'center' },
  separator: { height: 4 },
});
