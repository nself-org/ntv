/**
 * Purpose: EPGCell and EPGRow sub-components for the nTV Apple TV EPG panel.
 *          Extracted from EPGPanel.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   EPGCell — program: EPGProgram, isCurrent, cellWidth, onSelect
 *   EPGRow  — channel, programs, windowStart, windowEnd, totalWidth, onSelect, isFirst
 *
 * Outputs: TV-focusable EPG grid cells and channel rows.
 *
 * Constraints:
 *   - TV-only: no touch handlers.
 *   - Text ≥16pt in cells; channel col ≥18pt.
 *   - TVFocusGuideView per row for D-pad cell traversal.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS EPG panel rows
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import type { EPGChannel, EPGProgram } from '../../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Constants (re-exported for EPGPanel.tsx layout calculations)
// ---------------------------------------------------------------------------

export const PX_PER_MINUTE = 8;
export const MIN_CELL_WIDTH = 200;
export const ROW_HEIGHT = 80;
export const CHANNEL_COL_WIDTH = 180;
export const TIME_HEADER_HEIGHT = 44;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatHHMM(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateTimeMarks(startTime: Date, endTime: Date): Date[] {
  const marks: Date[] = [];
  const rounded = new Date(startTime);
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
// EPGCell
// ---------------------------------------------------------------------------

type EPGCellProps = {
  program: EPGProgram;
  isCurrent: boolean;
  cellWidth: number;
  onSelect: (channelId: string) => void;
};

export function EPGCell({ program, isCurrent, cellWidth, onSelect }: EPGCellProps) {
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
      <Text style={styles.epgCellTitle} numberOfLines={1}>{program.title}</Text>
      <Text style={styles.epgCellTime} numberOfLines={1}>
        {formatHHMM(new Date(program.startTime))}
        {' – '}
        {formatHHMM(new Date(program.endTime))}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// EPGRow
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

export function EPGRow({
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
      <View style={styles.channelCol}>
        <Text style={styles.channelColText} numberOfLines={2}>
          {channel.name}
        </Text>
      </View>

      <TVFocusGuideView
        style={[styles.programsContainer, { width: totalWidth }]}
        destinations={[]}
        autoFocus={isFirst}
      >
        <View style={styles.programsRow}>
          {programs.map((prog, idx) => {
            const startMs = new Date(prog.startTime).getTime();
            const endMs = new Date(prog.endTime).getTime();
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
// Styles
// ---------------------------------------------------------------------------

const COLORS = {
  panelBg: 'rgba(8, 12, 22, 0.97)',
  channelColBg: 'rgba(12, 16, 30, 0.96)',
  cellBg: 'rgba(255, 255, 255, 0.05)',
  cellCurrentBg: 'rgba(229, 9, 20, 0.25)',
  cellFocusBg: 'rgba(229, 9, 20, 0.90)',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  divider: 'rgba(255, 255, 255, 0.08)',
  borderAccent: '#E50914',
};

const styles = StyleSheet.create({
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
  programsContainer: { overflow: 'hidden' },
  programsRow: { flexDirection: 'row', height: ROW_HEIGHT },
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
  epgCellFocused: { backgroundColor: COLORS.cellFocusBg },
  epgCellTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  epgCellTime: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
});
