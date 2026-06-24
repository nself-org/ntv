/**
 * Purpose: Sub-components for the ɳTV EPG grid: ProgramTile, ChannelRow,
 *          TimelineHeader, CurrentTimeMarker. Extracted from EPGGrid.tsx to
 *          keep that file under 300 lines.
 *
 * Inputs/Outputs:
 *   ProgramTile    — program, channel, windowStart, onPress
 *   ChannelRow     — channel, programs, windowStart, sharedScrollX,
 *                    totalWindowMinutes, onProgramPress, registerRow
 *   TimelineHeader — windowStart, totalWindowMinutes
 *   CurrentTimeMarker — windowStart, totalWindowMinutes
 *
 * Constraints:
 *   - No business logic; pure presentational components.
 *   - PIXELS_PER_MINUTE, ROW_HEIGHT, LOGO_COLUMN_WIDTH constants exported for
 *     consumers (EPGGrid.tsx uses them for layout maths).
 *   - ChannelRow uses ref registration pattern so the grid master scroll can
 *     drive all row ScrollViews.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG-grid-components
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { EPGChannel, EPGProgram } from '../hooks/useEPG';
import { styles } from './EPGGridStyles';

// ---------------------------------------------------------------------------
// Layout constants — defined in ./EPGGridConstants, re-exported here so existing
// consumers (EPGGrid.tsx) keep importing them from this module unchanged.
// ---------------------------------------------------------------------------

export {
  PIXELS_PER_MINUTE,
  ROW_HEIGHT,
  LOGO_COLUMN_WIDTH,
  TIMELINE_HEIGHT,
  TIMELINE_LABEL_INTERVAL_MINUTES,
} from './EPGGridConstants';
import {
  PIXELS_PER_MINUTE,
  ROW_HEIGHT,
  TIMELINE_LABEL_INTERVAL_MINUTES,
} from './EPGGridConstants';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function minutesFromDate(date: Date, windowStart: Date): number {
  return (date.getTime() - windowStart.getTime()) / 60_000;
}

export function isoToDate(iso: string): Date {
  return new Date(iso);
}

export function isCurrentProgram(program: EPGProgram): boolean {
  const now = Date.now();
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  return now >= start && now < end;
}

export function formatTime(date: Date): string {
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

export const ProgramTile = memo(function ProgramTile({
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
  /** Register/unregister this row's horizontal ScrollView with the grid so
   *  the master scroll can drive it. */
  registerRow: (id: string, ref: ScrollView | null) => void;
};

export const ChannelRow = memo(function ChannelRow({
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

  useEffect(() => {
    registerRow(channel.id, rowScrollRef.current);
    if (rowScrollRef.current && sharedScrollX.current > 0) {
      rowScrollRef.current.scrollTo({ x: sharedScrollX.current, animated: false });
    }
    return () => registerRow(channel.id, null);
  }, [channel.id, registerRow, sharedScrollX]);

  return (
    <View style={styles.row}>
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
// TimelineHeader
// ---------------------------------------------------------------------------

type TimelineHeaderProps = {
  windowStart: Date;
  totalWindowMinutes: number;
};

export const TimelineHeader = memo(function TimelineHeader({
  windowStart,
  totalWindowMinutes,
}: TimelineHeaderProps) {
  const totalWidth = totalWindowMinutes * PIXELS_PER_MINUTE;

  const labels: { left: number; label: string }[] = [];
  for (let m = 0; m <= totalWindowMinutes; m += TIMELINE_LABEL_INTERVAL_MINUTES) {
    const d = new Date(windowStart.getTime() + m * 60_000);
    labels.push({ left: m * PIXELS_PER_MINUTE, label: formatTime(d) });
  }

  return (
    <View style={[styles.timelineHeader, { width: totalWidth }]}>
      {labels.map(({ left, label }) => (
        <Text key={label + left} style={[styles.timelineLabel, { left }]} numberOfLines={1}>
          {label}
        </Text>
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// CurrentTimeMarker
// ---------------------------------------------------------------------------

type CurrentTimeMarkerProps = {
  windowStart: Date;
  totalWindowMinutes: number;
};

export const CurrentTimeMarker = memo(function CurrentTimeMarker({
  windowStart,
  totalWindowMinutes,
}: CurrentTimeMarkerProps) {
  const now = new Date();
  const elapsedMinutes = minutesFromDate(now, windowStart);

  if (elapsedMinutes < 0 || elapsedMinutes > totalWindowMinutes) return null;

  return <View style={[styles.currentTimeMarker, { left: elapsedMinutes * PIXELS_PER_MINUTE }]} />;
});

// Styles live in ./EPGGridStyles.ts (extracted to keep this file <300 lines).
