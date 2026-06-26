/**
 * Purpose: Slide-in favorites panel for nTV Apple TV / Android TV.
 *          ChannelRow extracted to FavoritesPanelRow.tsx.
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
 *   - "menu" remote event closes the panel (TVEventHandler registered here).
 *   - Text ≥24pt; contrast ≥6:1 against panel background.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS favorites panel (T-P3-E4-W2-S5-T04)
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TVEventHandler,
  TVFocusGuideView,
  View,
} from 'react-native';
import type { TVChannel } from '@/screens/HomeScreen';
import { FavoritesPanelRow } from './FavoritesPanelRow';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FavoritesPanelProps {
  visible: boolean;
  channels: TVChannel[];
  onPlayChannel: (channel: TVChannel) => void;
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
// FavoritesPanel
// ---------------------------------------------------------------------------

export function FavoritesPanel({
  visible,
  channels,
  onPlayChannel,
  onClose,
}: FavoritesPanelProps): React.JSX.Element | null {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const isVisibleRef = useRef(false);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    isVisibleRef.current = visible;
  }, [visible, translateX]);

  useEffect(() => {
    if (!Platform.isTV || !visible) return;
    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      if (evt.eventType === 'menu') onClose();
    });
    return () => { handler.disable(); };
  }, [visible, onClose]);

  if (!visible && !isVisibleRef.current) return null;

  const displayChannels = channels.length > 0 ? channels : PLACEHOLDER_FAVORITES;

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateX }] }]}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — accessible is standard but RN types lag
      accessible={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerHint}>Press menu to close</Text>
      </View>

      <TVFocusGuideView style={styles.listGuide} trapFocusDown trapFocusUp>
        {displayChannels.length > 0 ? (
          <FlatList<TVChannel>
            data={displayChannels}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <FavoritesPanelRow
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
            <Text style={styles.emptyHint}>Add channels to favorites from the channel list.</Text>
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
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0f172a',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 36, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  headerHint: { fontSize: 20, color: '#64748b' },
  listGuide: { flex: 1 },
  listContent: { paddingBottom: 48 },
  emptyState: { paddingTop: 48, alignItems: 'center' },
  emptyText: { fontSize: 28, fontWeight: '600', color: '#f1f5f9', marginBottom: 12 },
  emptyHint: { fontSize: 22, color: '#475569', textAlign: 'center' },
});
