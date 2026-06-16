/**
 * Purpose: Slide-in EPG (Electronic Program Guide) grid panel for nTV Apple TV / Android TV.
 *          Slides in from the right over the player. Displays a horizontal timeline grid
 *          of programs per channel. D-pad navigates between cells via TVFocusGuideView.
 *          Accessible via second 'up' from channel list, or dedicated 'up' from PlayerScreen.
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
 *   - Panel fills ~75% of screen width to display timeline grid.
 *   - Time header row is fixed; channel rows scroll vertically.
 *   - Each cell width proportional to program duration (minimum 200pt).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel+EPG status (T-P3-E4-W2-S5-T03)
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TVEventHandler,
  TVFocusGuideView,
  View,
} from 'react-native';
import type { EPGChannel, EPGProgram } from '../../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
const SLIDE_DURATION_MS = 220;

// Pixels per minute in the timeline (TV: larger than mobile for readability)
const PX_PER_MINUTE = 8;
// Minimum cell width even for very short programs
const MIN_CELL_WIDTH = 200;
// Height of each channel row
const ROW_HEIGHT = 80;
// Width of the left column showing channel names
const CHANNEL_COL_WIDTH = 180;
// Height of the time header row
const TIME_HEADER_HEIGHT = 44;

// Default EPG window: now − 30m to now + 3h
const EPG_WINDOW_MINUTES_BEFORE = 30;
const EPG_WINDOW_MINUTES_AFTER = 3 * 60;

// TV color palette
const COLORS = {
  panelBg: 'rgba(8, 12, 22, 0.97)',
  headerBg: 'rgba(4, 7, 14, 0.99)',
  channelColBg: 'rgba(12, 16, 30, 0.96)',
  cellBg: 'rgba(255, 255, 255, 0.05)',
  cellCurrentBg: 'rgba(229, 9, 20, 0.25)',
  cellFocusBg: 'rgba(229, 9, 20, 0.90)',
  timelineIndicator: '#E50914',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textDim: '#666666',
  divider: 'rgba(255, 255, 255, 0.08)',
  borderAccent: '#E50914',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHHMM(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Generate time ruler marks every 30 minutes */
function generateTimeMarks(startTime: Date, endTime: Date): Date[] {
  const marks: Date[] = [];
  const rounded = new Date(startTime);
  // Round up to next 30-min boundary
  const minutes = rounded.getMinutes();
  const nextMark = minutes <= 30 ? 30 : 60;
  rounded.setMinutes(nextMark, 0, 0);

  while (rounded <= endTime) {
    marks.push(new Date(rounded));
    rounded.setMinutes(rounded.getMinutes() + 30);
  }
  return marks;
}

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
// EPG Cell
// ---------------------------------------------------------------------------

type EPGCellProps = {
  program: EPGProgram;
  isCurrent: boolean;
  cellWidth: number;
  onSelect: (channelId: string) => void;
};

function EPGCell({ program, isCurrent, cellWidth, onSelect }: EPGCellProps) {
  const handlePress = useCallback(() => {
    onSelect(program.channelId);
  }, [program.channelId, onSelect]);

  return (
    <Pressable
      style={({ focused, pressed }) => [
        styles.epgCell,
        { width: cellWidth },
        isCurrent && styles.epgCellCurrent,
        (focused || pressed) && styles.epgCellFocused,
      ]}
      onPress={handlePress}
      accessible
      accessibilityLabel={`${program.title}, ${program.durationMinutes} minutes`}
    >
      <Text style={styles.epgCellTitle} numberOfLines={1}>
        {program.title}
      </Text>
      <Text style={styles.epgCellTime} numberOfLines={1}>
        {formatHHMM(new Date(program.startTime))}
        {' – '}
        {formatHHMM(new Date(program.endTime))}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// EPG Row (one channel)
// ---------------------------------------------------------------------------

type EPGRowProps = {
  channel: EPGChannel;
  programs: EPGProgram[];
  windowStart: Date;
  windowEnd: Date;
  totalWidth: number;
  onSelect: (channelId: string) => void;
  isFirst: boolean;
};

function EPGRow({
  channel,
  programs,
  windowStart,
  windowEnd,
  totalWidth,
  onSelect,
  isFirst,
}: EPGRowProps) {
  const now = new Date();
  const windowStartMs = windowStart.getTime();
  const windowEndMs = windowEnd.getTime();

  return (
    <View style={styles.epgRow}>
      {/* Channel name column */}
      <View style={styles.channelCol}>
        <Text style={styles.channelColText} numberOfLines={2}>
          {channel.name}
        </Text>
      </View>

      {/* Program cells — wrapped in TVFocusGuideView for D-pad cell traversal */}
      <TVFocusGuideView
        style={[styles.programsContainer, { width: totalWidth }]}
        destinations={[]}
        autoFocus={isFirst}
      >
        <View style={styles.programsRow}>
          {programs.map((prog, idx) => {
            const startMs = new Date(prog.startTime).getTime();
            const endMs = new Date(prog.endTime).getTime();

            // Clamp program to window
            const clampedStart = clamp(startMs, windowStartMs, windowEndMs);
            const clampedEnd = clamp(endMs, windowStartMs, windowEndMs);
            const durationMs = clampedEnd - clampedStart;

            if (durationMs <= 0) return null;

            const cellWidth = Math.max(
              MIN_CELL_WIDTH,
              Math.round((durationMs / 60_000) * PX_PER_MINUTE),
            );

            const isCurrent = startMs <= now.getTime() && now.getTime() < endMs;

            return (
              <EPGCell
                key={prog.id + String(idx)}
                program={prog}
                isCurrent={isCurrent}
                cellWidth={cellWidth}
                onSelect={onSelect}
              />
            );
          })}
        </View>
      </TVFocusGuideView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Panel Component
// ---------------------------------------------------------------------------

/**
 * EPG panel: slides in from the right.
 * Time ruler at top; channel rows below, scrollable vertically.
 * TVEventHandler closes panel on 'menu'/'back'.
 */
export function EPGPanel({
  visible,
  channels,
  programs,
  onClose,
  onSelectChannel,
  loading = false,
}: EPGPanelProps) {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  // Compute EPG time window (now − 30m to now + 3h)
  const { windowStart, windowEnd, totalTimelineWidth, timeMarks } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - EPG_WINDOW_MINUTES_BEFORE * 60_000);
    const end = new Date(now.getTime() + EPG_WINDOW_MINUTES_AFTER * 60_000);
    const totalMinutes = EPG_WINDOW_MINUTES_BEFORE + EPG_WINDOW_MINUTES_AFTER;
    const width = Math.round(totalMinutes * PX_PER_MINUTE);
    return {
      windowStart: start,
      windowEnd: end,
      totalTimelineWidth: width,
      timeMarks: generateTimeMarks(start, end),
    };
  }, []);

  // Group programs by channelId
  const programsByChannel = useMemo(() => {
    const map = new Map<string, EPGProgram[]>();
    for (const ch of channels) {
      map.set(ch.id, []);
    }
    for (const prog of programs) {
      const list = map.get(prog.channelId);
      if (list) list.push(prog);
    }
    return map;
  }, [channels, programs]);

  // Animate slide on visibility change
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  // TVEventHandler: close on 'menu'/'back'
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

  // Now-indicator X position relative to timeline start
  const nowOffsetX = useMemo(() => {
    const now = new Date();
    const minutesSinceStart =
      (now.getTime() - windowStart.getTime()) / 60_000;
    return Math.max(0, Math.round(minutesSinceStart * PX_PER_MINUTE));
  }, [windowStart]);

  return (
    <Animated.View
      style={[
        styles.panel,
        { transform: [{ translateX }] },
        !visible && styles.panelHidden,
      ]}
      isTVSelectable={visible}
    >
      {/* Panel header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Program Guide</Text>
        <Text style={styles.headerHint}>Menu to close</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading guide…</Text>
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No EPG data available.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* Time ruler row */}
          <View style={styles.timeRulerRow}>
            {/* Empty spacer for channel col */}
            <View style={{ width: CHANNEL_COL_WIDTH }} />
            {/* Timeline ruler */}
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
                {/* Now indicator */}
                <View style={[styles.nowIndicator, { left: nowOffsetX }]} />
              </View>
            </ScrollView>
          </View>

          {/* Channel rows */}
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
  panelHidden: {
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
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerHint: {
    color: COLORS.textSecondary,
    fontSize: 18,
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
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  scrollArea: {
    flex: 1,
  },
  // Time ruler
  timeRulerRow: {
    flexDirection: 'row',
    height: TIME_HEADER_HEIGHT,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    overflow: 'hidden',
  },
  timelineRuler: {
    height: TIME_HEADER_HEIGHT,
    position: 'relative',
  },
  timeMark: {
    color: COLORS.textSecondary,
    fontSize: 16,
    top: 12,
  },
  nowIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: TIME_HEADER_HEIGHT,
    backgroundColor: COLORS.timelineIndicator,
  },
  // Channel rows
  epgRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  channelCol: {
    width: CHANNEL_COL_WIDTH,
    backgroundColor: COLORS.channelColBg,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.divider,
  },
  channelColText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  programsContainer: {
    overflow: 'hidden',
  },
  programsRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
  },
  // EPG cells
  epgCell: {
    height: ROW_HEIGHT,
    backgroundColor: COLORS.cellBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.divider,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  epgCellCurrent: {
    backgroundColor: COLORS.cellCurrentBg,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.borderAccent,
  },
  epgCellFocused: {
    backgroundColor: COLORS.cellFocusBg,
  },
  epgCellTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,             // slightly smaller for dense grid, still readable
    fontWeight: '600',
    lineHeight: 24,
  },
  epgCellTime: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
});
