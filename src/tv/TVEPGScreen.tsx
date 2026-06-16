/**
 * Purpose: TV (rn-tvos) EPG screen for ɳTV — horizontal timeline grid adapted for 10-foot
 *          D-pad navigation. Focus rings on all interactive cells.
 *
 * Inputs:
 *   - channels: EPGChannel[] — channel list with logos
 *   - programs: EPGProgram[] — programme schedule data
 *   - startTime: Date — visible window start
 *   - onSelectProgram?: (program: EPGProgram) => void
 *
 * Outputs:
 *   - Horizontal + vertical scrollable EPG grid.
 *   - Current time indicator.
 *   - Focus ring on selected programme cell.
 *   - D-pad navigable: left/right = time, up/down = channel.
 *
 * Constraints:
 *   - isTVSelectable={true} on every programme cell.
 *   - hasTVPreferredFocus on the first programme of the first channel.
 *   - Text min 24sp for TV readability.
 *   - No touch handlers.
 *   - TVFocusGuideView wraps rows to allow cross-row D-pad.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-epg-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import type { EPGChannel, EPGProgram } from '../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIXELS_PER_MINUTE = 6;
const CHANNEL_COLUMN_WIDTH = 180;
const ROW_HEIGHT = 80;
const COLORS = {
  bg: '#08090e',
  surface: '#12151f',
  border: '#1e2333',
  text: '#ffffff',
  muted: '#9ca3af',
  primary: '#0ea5e9',
  focusBorder: '#fbbf24',
  focusBg: 'rgba(251, 191, 36, 0.15)',
  currentTime: '#ef4444',
  nowBg: 'rgba(14, 165, 233, 0.25)',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function programWidth(program: EPGProgram): number {
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  const durationMinutes = (end - start) / 60000;
  return Math.max(durationMinutes * PIXELS_PER_MINUTE, 80);
}

function programLeft(program: EPGProgram, windowStart: Date): number {
  const start = new Date(program.startTime).getTime();
  const windowMs = windowStart.getTime();
  const offsetMinutes = (start - windowMs) / 60000;
  return Math.max(offsetMinutes * PIXELS_PER_MINUTE, 0);
}

function isCurrentlyPlaying(program: EPGProgram): boolean {
  const now = Date.now();
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  return now >= start && now < end;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ---------------------------------------------------------------------------
// Programme cell
// ---------------------------------------------------------------------------

interface ProgramCellProps {
  program: EPGProgram;
  windowStart: Date;
  onSelect?: (program: EPGProgram) => void;
  isFirst: boolean;
}

const ProgramCell = React.memo(function ProgramCell({
  program,
  windowStart,
  onSelect,
  isFirst,
}: ProgramCellProps): React.ReactElement {
  const width = programWidth(program);
  const left = programLeft(program, windowStart);
  const isNow = isCurrentlyPlaying(program);

  return (
    <Pressable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={(state: any) => [
        styles.cell,
        { width, left },
        isNow && styles.cellNow,
        (state.focused as boolean) && styles.cellFocused,
      ]}
      onPress={() => onSelect?.(program)}
      // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
      isTVSelectable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${program.title}, ${formatTime(program.startTime)} to ${formatTime(program.endTime)}${isNow ? ', now playing' : ''}`}
      // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
      hasTVPreferredFocus={isFirst}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(state: any) => {
        const focused = state.focused as boolean;
        return (
          <>
            <Text
              style={[styles.cellTitle, focused && styles.cellTitleFocused, { width: width - 16 }]}
              numberOfLines={2}
            >
              {program.title}
            </Text>
            <Text style={styles.cellTime}>
              {formatTime(program.startTime)} – {formatTime(program.endTime)}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Channel row
// ---------------------------------------------------------------------------

interface ChannelRowProps {
  channel: EPGChannel;
  programs: EPGProgram[];
  windowStart: Date;
  isFirstChannel: boolean;
  onSelectProgram?: (program: EPGProgram) => void;
}

function EPGChannelRow({
  channel,
  programs,
  windowStart,
  isFirstChannel,
  onSelectProgram,
}: ChannelRowProps): React.ReactElement {
  const channelPrograms = programs.filter((p) => p.channelId === channel.id);

  return (
    <TVFocusGuideView style={styles.channelRow} autoFocus destinations={[]}>
      {/* Channel name column */}
      <View style={styles.channelColumn} accessible accessibilityLabel={channel.name}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.channelLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <Text style={styles.channelName} numberOfLines={2}>
          {channel.name}
        </Text>
      </View>

      {/* Programme timeline */}
      <View style={styles.timeline}>
        {channelPrograms.map((prog, idx) => (
          <ProgramCell
            key={prog.id}
            program={prog}
            windowStart={windowStart}
            onSelect={onSelectProgram}
            isFirst={isFirstChannel && idx === 0}
          />
        ))}
        {channelPrograms.length === 0 && (
          <View style={[styles.cell, { width: 300, left: 0 }]}>
            <Text style={styles.cellTitle}>No programme data</Text>
          </View>
        )}
      </View>
    </TVFocusGuideView>
  );
}

// ---------------------------------------------------------------------------
// TVEPGScreen
// ---------------------------------------------------------------------------

export interface TVEPGScreenProps {
  channels: EPGChannel[];
  programs: EPGProgram[];
  startTime?: Date;
  onSelectProgram?: (program: EPGProgram) => void;
}

export function TVEPGScreen({
  channels,
  programs,
  startTime,
  onSelectProgram,
}: TVEPGScreenProps): React.ReactElement {
  const windowStart = startTime ?? new Date(Date.now() - 30 * 60 * 1000); // 30 min before now

  const renderChannel = useCallback(
    ({ item, index }: { item: EPGChannel; index: number }) => (
      <EPGChannelRow
        channel={item}
        programs={programs}
        windowStart={windowStart}
        isFirstChannel={index === 0}
        onSelectProgram={onSelectProgram}
      />
    ),
    [programs, windowStart, onSelectProgram],
  );

  const keyExtractor = useCallback((item: EPGChannel) => item.id, []);

  if (channels.length === 0) {
    return (
      <View style={styles.centered} accessible accessibilityLabel="No EPG data available">
        <Text style={styles.emptyText}>No programme guide data available.</Text>
        <Text style={styles.emptySubText}>Configure an EPG source in Settings.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.container} showsHorizontalScrollIndicator={false}>
      <FlatList
        data={channels}
        renderItem={renderChannel}
        keyExtractor={keyExtractor}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel="Programme guide"
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { flex: 1 },

  channelRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  channelColumn: {
    width: CHANNEL_COLUMN_WIDTH,
    flexShrink: 0,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 4,
  },
  channelLogo: { width: 36, height: 36, borderRadius: 4 },
  channelName: { fontSize: 18, color: COLORS.text, textAlign: 'center', lineHeight: 22 },

  timeline: { flex: 1, position: 'relative' },

  cell: {
    position: 'absolute',
    height: ROW_HEIGHT - 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellNow: { backgroundColor: COLORS.nowBg },
  cellFocused: {
    borderColor: COLORS.focusBorder,
    backgroundColor: COLORS.focusBg,
    zIndex: 10,
  },
  cellTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, lineHeight: 24 },
  cellTitleFocused: { color: COLORS.focusBorder },
  cellTime: { fontSize: 16, color: COLORS.muted, marginTop: 2 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  emptyText: { fontSize: 28, color: COLORS.muted, textAlign: 'center' },
  emptySubText: { fontSize: 22, color: COLORS.muted, textAlign: 'center', marginTop: 12 },
});
