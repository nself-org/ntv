/**
 * Purpose: Extracted sub-components for TVEPGScreen — programme cell and channel row.
 *          Extracted from TVEPGScreen.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   ProgramCell  — single programme tile on the EPG timeline.
 *   EPGChannelRow — one full row (logo column + programme timeline).
 *
 * Outputs: D-pad-focusable programme tiles and channel rows for the TV EPG grid.
 *
 * Constraints:
 *   - isTVSelectable={true} on every programme cell.
 *   - hasTVPreferredFocus only on the first programme of the first channel.
 *   - Text ≥24sp for TV readability at 3m.
 *   - No touch handlers — D-pad/remote only.
 *   - TVFocusGuideView wraps every channel row for up/down D-pad navigation.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-epg-screen (extracted components)
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import type { EPGChannel, EPGProgram } from '../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Constants (shared with TVEPGScreen.tsx)
// ---------------------------------------------------------------------------

export const PIXELS_PER_MINUTE = 6;
export const CHANNEL_COLUMN_WIDTH = 180;
export const ROW_HEIGHT = 80;

export const COLORS = {
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

export function programWidth(program: EPGProgram): number {
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  const durationMinutes = (end - start) / 60000;
  return Math.max(durationMinutes * PIXELS_PER_MINUTE, 80);
}

export function programLeft(program: EPGProgram, windowStart: Date): number {
  const start = new Date(program.startTime).getTime();
  const windowMs = windowStart.getTime();
  const offsetMinutes = (start - windowMs) / 60000;
  return Math.max(offsetMinutes * PIXELS_PER_MINUTE, 0);
}

export function isCurrentlyPlaying(program: EPGProgram): boolean {
  const now = Date.now();
  const start = new Date(program.startTime).getTime();
  const end = new Date(program.endTime).getTime();
  return now >= start && now < end;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ---------------------------------------------------------------------------
// ProgramCell
// ---------------------------------------------------------------------------

export interface ProgramCellProps {
  program: EPGProgram;
  windowStart: Date;
  onSelect?: (program: EPGProgram) => void;
  isFirst: boolean;
}

export const ProgramCell = React.memo(function ProgramCell({
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
// EPGChannelRow
// ---------------------------------------------------------------------------

export interface EPGChannelRowProps {
  channel: EPGChannel;
  programs: EPGProgram[];
  windowStart: Date;
  isFirstChannel: boolean;
  onSelectProgram?: (program: EPGProgram) => void;
}

export function EPGChannelRow({
  channel,
  programs,
  windowStart,
  isFirstChannel,
  onSelectProgram,
}: EPGChannelRowProps): React.ReactElement {
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
// Styles (shared between cell and row)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
});
