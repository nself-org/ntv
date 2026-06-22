/**
 * Purpose: Slide-in EPG (Electronic Program Guide) panel for nTV Apple TV / Android TV.
 *          Sub-components (EPGCell, EPGRow) extracted to EPGPanelRows.tsx.
 *
 * Inputs:
 *   - visible: boolean — controls animated slide-in/out
 *   - channels: EPGChannel[] — channel rows
 *   - programs: EPGProgram[] — all programs for the time window
 *   - onClose: () => void — called on 'menu' remote button
 *   - onSelectChannel: (channelId: string) => void — tunes to a channel from EPG
 *
 * Outputs: Absolute overlay React element, animated from right.
 *
 * Constraints:
 *   - TV-only: D-pad navigation through EPG cells via TVFocusGuideView.
 *   - Text size ≥24pt across all cells for 3m readability.
 *   - 'menu' (tvOS) / 'back' (Android TV) closes the panel.
 *   - No touch handlers. No safe-area padding.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel+EPG status (T-P3-E4-W2-S5-T03)
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TVEventHandler,
  View,
} from 'react-native';
import type { EPGChannel, EPGProgram } from '../../../hooks/useEPG';
import {
  CHANNEL_COL_WIDTH,
  EPGRow,
  PX_PER_MINUTE,
  TIME_HEADER_HEIGHT,
  formatHHMM,
  generateTimeMarks,
} from './EPGPanelRows';

const EPG_BEFORE = 30;
const EPG_AFTER = 3 * 60;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
const SLIDE_DURATION_MS = 220;

const COLORS = {
  panelBg: 'rgba(8, 12, 22, 0.97)',
  headerBg: 'rgba(4, 7, 14, 0.99)',
  timelineIndicator: '#E50914',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  divider: 'rgba(255, 255, 255, 0.08)',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EPGPanelProps = {
  visible: boolean;
  channels: EPGChannel[];
  programs: EPGProgram[];
  onClose: () => void;
  onSelectChannel: (channelId: string) => void;
  loading?: boolean;
};

// ---------------------------------------------------------------------------
// EPGPanel
// ---------------------------------------------------------------------------

export function EPGPanel({
  visible,
  channels,
  programs,
  onClose,
  onSelectChannel,
  loading = false,
}: EPGPanelProps) {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  const { windowStart, windowEnd, totalTimelineWidth, timeMarks } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - EPG_BEFORE * 60_000);
    const end = new Date(now.getTime() + EPG_AFTER * 60_000);
    const totalMinutes = EPG_BEFORE + EPG_AFTER;
    return {
      windowStart: start,
      windowEnd: end,
      totalTimelineWidth: Math.round(totalMinutes * PX_PER_MINUTE),
      timeMarks: generateTimeMarks(start, end),
    };
  }, []);

  const programsByChannel = useMemo(() => {
    const map = new Map<string, EPGProgram[]>();
    for (const ch of channels) map.set(ch.id, []);
    for (const prog of programs) {
      const list = map.get(prog.channelId);
      if (list) list.push(prog);
    }
    return map;
  }, [channels, programs]);

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
      if (evt.eventType === 'menu') onClose();
    });
    return () => { handler.disable(); };
  }, [visible, onClose]);

  const nowOffsetX = useMemo(() => {
    const elapsedMinutes = (Date.now() - windowStart.getTime()) / 60_000;
    return Math.max(0, Math.round(elapsedMinutes * PX_PER_MINUTE));
  }, [windowStart]);

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateX }] }, !visible && styles.panelHidden]}
      isTVSelectable={visible}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Program Guide</Text>
        <Text style={styles.headerHint}>Menu to close</Text>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Loading guide…</Text>
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>No EPG data available.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* Time ruler row */}
          <View style={styles.timeRulerRow}>
            <View style={{ width: CHANNEL_COL_WIDTH }} />
            <ScrollView
              horizontal
              scrollEnabled={false}
              style={{ width: PANEL_WIDTH - CHANNEL_COL_WIDTH }}
              showsHorizontalScrollIndicator={false}
            >
              <View style={[styles.timelineRuler, { width: totalTimelineWidth }]}>
                {timeMarks.map((mark) => {
                  const xOffset = Math.round(
                    ((mark.getTime() - windowStart.getTime()) / 60_000) * PX_PER_MINUTE,
                  );
                  return (
                    <Text
                      key={mark.toISOString()}
                      style={[styles.timeMark, { position: 'absolute', left: xOffset - 20 }]}
                    >
                      {formatHHMM(mark)}
                    </Text>
                  );
                })}
                <View style={[styles.nowIndicator, { left: nowOffsetX }]} />
              </View>
            </ScrollView>
          </View>

          {channels.map((channel, idx) => (
            <EPGRow
              key={channel.id}
              channel={channel}
              programs={programsByChannel.get(channel.id) ?? []}
              windowStart={windowStart}
              windowEnd={windowEnd}
              totalWidth={totalTimelineWidth}
              onSelect={onSelectChannel}
              isFirst={idx === 0}
            />
          ))}
        </ScrollView>
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
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 24 },
  scrollArea: { flex: 1 },
  timeRulerRow: {
    flexDirection: 'row',
    height: TIME_HEADER_HEIGHT,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    overflow: 'hidden',
  },
  timelineRuler: { height: TIME_HEADER_HEIGHT, position: 'relative' },
  timeMark: { color: COLORS.textSecondary, fontSize: 16, top: 12 },
  nowIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: TIME_HEADER_HEIGHT,
    backgroundColor: COLORS.timelineIndicator,
  },
});
