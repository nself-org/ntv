/**
 * Purpose: Virtualized EPG (Electronic Program Guide) grid for nTV.
 * Renders channels on the Y axis and time slots on the X axis.
 * Uses FlashList for vertical virtualization of channel rows.
 * Each row contains a horizontally scrollable list of time-proportional program tiles.
 * Current program is highlighted in each row. A red time-marker line shows "now".
 *
 * Inputs:
 *   - channels: EPGChannel[] — ordered list of channels for Y axis
 *   - programs: EPGProgram[] — flat list of programs across all channels
 *   - startTime: Date — window start (for timeline header)
 *   - onProgramPress: (program: EPGProgram, channel: EPGChannel) => void — open detail modal
 *
 * Outputs:
 *   - Renders the EPG grid with timeline header, channel logos, and program tiles.
 *
 * Constraints:
 *   - FlashList is required for vertical axis (not FlatList) — performance criterion.
 *   - 1 minute = PIXELS_PER_MINUTE px horizontally.
 *   - Memoized program tiles to prevent unnecessary re-renders.
 *   - Timeline auto-scrolls to current time on load.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG feature status updated
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { EPGChannel, EPGProgram } from '../hooks/useEPG';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Pixels per minute — 1 min = 4px gives a comfortable density */
const PIXELS_PER_MINUTE = 4;

/** Height of each channel row in the grid */
const ROW_HEIGHT = 64;

/** Width of the left column showing channel logos */
const LOGO_COLUMN_WIDTH = 72;

/** Height of the timeline header row */
const TIMELINE_HEIGHT = 32;

/** How often the timeline renders a label (every N minutes) */
const TIMELINE_LABEL_INTERVAL_MINUTES = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function minutesFromDate(date: Date, windowStart: Date): number {
  return (date.getTime() - windowStart.getTime()) / 60_000;
}

function isoToDate(iso: string): Date {
  return new Date(iso);
}

function isCurrentProgram(program: EPGProgram): boolean {
  const now = Date.now();
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  return now >= start && now < end;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ---------------------------------------------------------------------------
// ProgramTile — memoized to avoid re-renders on sibling changes
// ---------------------------------------------------------------------------

type ProgramTileProps = {
  program: EPGProgram;
  channel: EPGChannel;
  windowStart: Date;
  onPress: (program: EPGProgram, channel: EPGChannel) => void;
};

const ProgramTile = memo(function ProgramTile({
  program,
  channel,
  windowStart,
  onPress,
}: ProgramTileProps) {
  const startDate = isoToDate(program.startTime);
  const offsetMinutes = minutesFromDate(startDate, windowStart);
  const widthPx = program.durationMinutes * PIXELS_PER_MINUTE;
  const leftPx = offsetMinutes * PIXELS_PER_MINUTE;
  const current = isCurrentProgram(program);

  const handlePress = useCallback(() => {
    onPress(program, channel);
  }, [program, channel, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.programTile,
        { left: leftPx, width: Math.max(widthPx - 2, 2) },
        current && styles.programTileCurrent,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityLabel={`${program.title}, ${formatTime(startDate)}`}
      accessibilityRole="button"
    >
      <Text style={styles.programTitle} numberOfLines={1}>
        {program.title}
      </Text>
      <Text style={styles.programTime} numberOfLines={1}>
        {formatTime(startDate)}
      </Text>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// ChannelRow — one row in the FlashList
// ---------------------------------------------------------------------------

type ChannelRowProps = {
  channel: EPGChannel;
  programs: EPGProgram[];
  windowStart: Date;
  sharedScrollX: React.MutableRefObject<number>;
  totalWindowMinutes: number;
  onProgramPress: (program: EPGProgram, channel: EPGChannel) => void;
  /** Register/unregister this row's horizontal ScrollView with the grid so the
   *  master scroll can drive it. Without this the grid's ref Map stays empty
   *  and only the header scrolls. */
  registerRow: (id: string, ref: ScrollView | null) => void;
};

const ChannelRow = memo(function ChannelRow({
  channel,
  programs,
  windowStart,
  sharedScrollX,
  totalWindowMinutes,
  onProgramPress,
  registerRow,
}: ChannelRowProps) {
  const rowScrollRef = useRef<ScrollView>(null);
  const totalWidth = totalWindowMinutes * PIXELS_PER_MINUTE;

  // Register this row's ScrollView into the grid's ref Map so onMasterScroll
  // and the auto-scroll-on-load can drive it; unregister on unmount/recycle.
  useEffect(() => {
    registerRow(channel.id, rowScrollRef.current);
    // Align newly-mounted/recycled rows to the current shared scroll position.
    if (rowScrollRef.current && sharedScrollX.current > 0) {
      rowScrollRef.current.scrollTo({
        x: sharedScrollX.current,
        animated: false,
      });
    }
    return () => registerRow(channel.id, null);
  }, [channel.id, registerRow, sharedScrollX]);

  return (
    <View style={styles.row}>
      {/* Channel logo column */}
      <View style={styles.logoColumn}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.channelLogo}
            resizeMode="contain"
            accessibilityLabel={channel.name}
          />
        ) : (
          <View style={styles.channelLogoPlaceholder}>
            <Text style={styles.channelLogoText} numberOfLines={2}>
              {channel.name}
            </Text>
          </View>
        )}
      </View>

      {/* Program tiles — horizontally scrollable, synced to shared scroll */}
      <ScrollView
        ref={rowScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.programsScroll}
        contentContainerStyle={{ width: totalWidth }}
      >
        <View style={{ width: totalWidth, height: ROW_HEIGHT }}>
          {programs.map((p) => (
            <ProgramTile
              key={p.id}
              program={p}
              channel={channel}
              windowStart={windowStart}
              onPress={onProgramPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

// ---------------------------------------------------------------------------
// TimelineHeader — scrolls horizontally in sync with the grid
// ---------------------------------------------------------------------------

type TimelineHeaderProps = {
  windowStart: Date;
  totalWindowMinutes: number;
};

const TimelineHeader = memo(function TimelineHeader({
  windowStart,
  totalWindowMinutes,
}: TimelineHeaderProps) {
  const totalWidth = totalWindowMinutes * PIXELS_PER_MINUTE;

  const labels: { left: number; label: string }[] = [];
  for (
    let m = 0;
    m <= totalWindowMinutes;
    m += TIMELINE_LABEL_INTERVAL_MINUTES
  ) {
    const d = new Date(windowStart.getTime() + m * 60_000);
    labels.push({ left: m * PIXELS_PER_MINUTE, label: formatTime(d) });
  }

  return (
    <View style={[styles.timelineHeader, { width: totalWidth }]}>
      {labels.map(({ left, label }) => (
        <Text
          key={label + left}
          style={[styles.timelineLabel, { left }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// CurrentTimeMarker — absolute red line on the timeline
// ---------------------------------------------------------------------------

type CurrentTimeMarkerProps = {
  windowStart: Date;
  totalWindowMinutes: number;
};

const CurrentTimeMarker = memo(function CurrentTimeMarker({
  windowStart,
  totalWindowMinutes,
}: CurrentTimeMarkerProps) {
  const now = new Date();
  const elapsedMinutes = minutesFromDate(now, windowStart);

  if (elapsedMinutes < 0 || elapsedMinutes > totalWindowMinutes) return null;

  const left = elapsedMinutes * PIXELS_PER_MINUTE;

  return <View style={[styles.currentTimeMarker, { left }]} />;
});

// ---------------------------------------------------------------------------
// EPGGrid — main export
// ---------------------------------------------------------------------------

export type EPGGridProps = {
  channels: EPGChannel[];
  programs: EPGProgram[];
  startTime: Date;
  endTime: Date;
  onProgramPress: (program: EPGProgram, channel: EPGChannel) => void;
};

export function EPGGrid({
  channels,
  programs,
  startTime,
  endTime,
  onProgramPress,
}: EPGGridProps) {
  const totalWindowMinutes = useMemo(
    () => Math.round((endTime.getTime() - startTime.getTime()) / 60_000),
    [startTime, endTime],
  );

  const totalWidth = totalWindowMinutes * PIXELS_PER_MINUTE;

  // Programs indexed by channelId for O(1) lookup per row
  const programsByChannel = useMemo(() => {
    const map = new Map<string, EPGProgram[]>();
    for (const p of programs) {
      const arr = map.get(p.channelId) ?? [];
      arr.push(p);
      map.set(p.channelId, arr);
    }
    return map;
  }, [programs]);

  // Shared horizontal scroll position — propagated to all rows
  const sharedScrollX = useRef<number>(0);
  const masterScrollRef = useRef<ScrollView>(null);

  // All row refs for coordinated scroll
  const rowScrollRefs = useRef<Map<string, ScrollView>>(new Map());
  // Timeline header ScrollView — also driven by the master scroll.
  const headerScrollRef = useRef<ScrollView>(null);

  // Register/unregister a row's ScrollView. Passed down to every ChannelRow so
  // the Map is actually populated (previously it was always empty, so scroll
  // sync was a no-op and only the header tracked the master scroll).
  const registerRow = useCallback((id: string, ref: ScrollView | null) => {
    if (ref) {
      rowScrollRefs.current.set(id, ref);
    } else {
      rowScrollRefs.current.delete(id);
    }
  }, []);

  // Apply a horizontal offset to the header + every registered row.
  const applyScrollX = useCallback((x: number, animated: boolean) => {
    headerScrollRef.current?.scrollTo({ x, animated });
    rowScrollRefs.current.forEach((ref) => {
      ref.scrollTo({ x, animated });
    });
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const elapsedMinutes = minutesFromDate(now, startTime);
    if (elapsedMinutes > 0) {
      const targetX = Math.max(0, elapsedMinutes * PIXELS_PER_MINUTE - 80);
      setTimeout(() => {
        masterScrollRef.current?.scrollTo({ x: targetX, animated: true });
        sharedScrollX.current = targetX;
        applyScrollX(targetX, false);
      }, 300);
    }
  }, [startTime, applyScrollX]);

  // Sync header + all row scrolls when master scrolls
  const onMasterScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = event.nativeEvent.contentOffset.x;
      sharedScrollX.current = x;
      applyScrollX(x, false);
    },
    [applyScrollX],
  );

  const renderItem = useCallback(
    ({ item: channel }: { item: EPGChannel }) => {
      const channelPrograms = programsByChannel.get(channel.id) ?? [];
      return (
        <ChannelRow
          channel={channel}
          programs={channelPrograms}
          windowStart={startTime}
          sharedScrollX={sharedScrollX}
          totalWindowMinutes={totalWindowMinutes}
          onProgramPress={onProgramPress}
          registerRow={registerRow}
        />
      );
    },
    [programsByChannel, startTime, totalWindowMinutes, onProgramPress, registerRow],
  );

  return (
    <View style={styles.container}>
      {/* Sticky left logo column header (empty, same width as logo column) */}
      <View style={styles.headerRow}>
        <View style={{ width: LOGO_COLUMN_WIDTH }} />

        {/* Timeline header — scrolls horizontally via master scroll */}
        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.timelineScroll}
          contentContainerStyle={{ width: totalWidth }}
        >
          <View style={{ width: totalWidth, position: 'relative' }}>
            <TimelineHeader
              windowStart={startTime}
              totalWindowMinutes={totalWindowMinutes}
            />
            <CurrentTimeMarker
              windowStart={startTime}
              totalWindowMinutes={totalWindowMinutes}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.gridBody}>
        {/* Invisible master horizontal ScrollView — drives all rows */}
        <ScrollView
          ref={masterScrollRef}
          horizontal
          showsHorizontalScrollIndicator
          onScroll={onMasterScroll}
          scrollEventThrottle={16}
          style={styles.masterScroll}
          contentContainerStyle={{ width: totalWidth + LOGO_COLUMN_WIDTH }}
        >
          <View style={{ width: totalWidth + LOGO_COLUMN_WIDTH, height: 1 }} />
        </ScrollView>

        {/* Channel rows — vertical via FlashList */}
        <View style={styles.rowsWrapper}>
          {/* Logo column (sticky left) */}
          <View style={styles.stickyLogoColumn}>
            {channels.map((ch) => (
              <View key={ch.id} style={styles.logoCell}>
                {ch.logoUrl ? (
                  <Image
                    source={{ uri: ch.logoUrl }}
                    style={styles.channelLogo}
                    resizeMode="contain"
                    accessibilityLabel={ch.name}
                  />
                ) : (
                  <View style={styles.channelLogoPlaceholder}>
                    <Text style={styles.channelLogoText} numberOfLines={2}>
                      {ch.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Program columns — FlashList for vertical virtualization */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ width: totalWidth }}
          >
            <FlashList
              data={channels}
              renderItem={({ item: channel }) => {
                const channelPrograms =
                  programsByChannel.get(channel.id) ?? [];
                return (
                  <View
                    style={[styles.programRow, { width: totalWidth }]}
                  >
                    {channelPrograms.map((p) => (
                      <ProgramTile
                        key={p.id}
                        program={p}
                        channel={channel}
                        windowStart={startTime}
                        onPress={onProgramPress}
                      />
                    ))}
                  </View>
                );
              }}
              estimatedItemSize={ROW_HEIGHT}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              getItemType={() => 'channel-row'}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  headerRow: {
    flexDirection: 'row',
    height: TIMELINE_HEIGHT,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineHeader: {
    height: TIMELINE_HEIGHT,
    position: 'relative',
  },
  timelineLabel: {
    position: 'absolute',
    top: 6,
    color: '#aaa',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  currentTimeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e53e3e',
    zIndex: 10,
  },
  gridBody: {
    flex: 1,
  },
  masterScroll: {
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
  rowsWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  stickyLogoColumn: {
    width: LOGO_COLUMN_WIDTH,
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  logoCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    padding: 4,
  },
  channelLogo: {
    width: 52,
    height: 36,
  },
  channelLogoPlaceholder: {
    width: 52,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 4,
  },
  channelLogoText: {
    color: '#aaa',
    fontSize: 9,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  logoColumn: {
    width: LOGO_COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: '#333',
    padding: 4,
  },
  programsScroll: {
    flex: 1,
  },
  programRow: {
    height: ROW_HEIGHT,
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  programTile: {
    position: 'absolute',
    top: 4,
    height: ROW_HEIGHT - 8,
    backgroundColor: '#1e3a5f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  programTileCurrent: {
    backgroundColor: '#2b6cb0',
    borderLeftWidth: 3,
    borderLeftColor: '#63b3ed',
  },
  programTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  programTime: {
    color: '#90cdf4',
    fontSize: 10,
    marginTop: 2,
  },
});
