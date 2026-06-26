/**
 * Purpose: Virtualized EPG (Electronic Program Guide) grid for nTV.
 *          Renders channels on the Y axis and time slots on the X axis.
 *          Uses FlashList for vertical virtualization of channel rows.
 *          Sub-components (ProgramTile, ChannelRow, TimelineHeader,
 *          CurrentTimeMarker) extracted to EPGGridComponents.tsx.
 *
 * Inputs:
 *   - channels: EPGChannel[] — ordered list of channels for Y axis
 *   - programs: EPGProgram[] — flat list of programs across all channels
 *   - startTime: Date — window start (for timeline header)
 *   - endTime: Date — window end
 *   - onProgramPress: (program: EPGProgram, channel: EPGChannel) => void
 *
 * Outputs: Renders the EPG grid with timeline header, channel logos, program tiles.
 *
 * Constraints:
 *   - FlashList required for vertical axis (performance criterion).
 *   - 1 minute = PIXELS_PER_MINUTE px horizontally.
 *   - Timeline auto-scrolls to current time on load.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG feature status updated
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { EPGChannel, EPGProgram } from '../hooks/useEPG';
import {
  ChannelRow,
  CurrentTimeMarker,
  LOGO_COLUMN_WIDTH,
  PIXELS_PER_MINUTE,
  ROW_HEIGHT,
  TimelineHeader,
  minutesFromDate,
} from './EPGGridComponents';

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

  const sharedScrollX = useRef<number>(0);
  const masterScrollRef = useRef<ScrollView>(null);
  const rowScrollRefs = useRef<Map<string, ScrollView>>(new Map());
  const headerScrollRef = useRef<ScrollView>(null);

  const registerRow = useCallback((id: string, ref: ScrollView | null) => {
    if (ref) {
      rowScrollRefs.current.set(id, ref);
    } else {
      rowScrollRefs.current.delete(id);
    }
  }, []);

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
      <View style={styles.headerRow}>
        <View style={{ width: LOGO_COLUMN_WIDTH }} />

        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.timelineScroll}
          contentContainerStyle={{ width: totalWidth }}
        >
          <View style={{ width: totalWidth, position: 'relative' }}>
            <TimelineHeader windowStart={startTime} totalWindowMinutes={totalWindowMinutes} />
            <CurrentTimeMarker windowStart={startTime} totalWindowMinutes={totalWindowMinutes} />
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

        <View style={styles.rowsWrapper}>
          {/* Logo column (sticky left) */}
          <View style={styles.stickyLogoColumn}>
            {channels.map((ch) => (
              <View key={ch.id} style={styles.logoCell}>
                {ch.logoUrl ? null : null /* logo rendered inside ChannelRow */}
              </View>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ width: totalWidth }}
          >
            <FlashList
              data={channels}
              renderItem={renderItem}
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
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  headerRow: {
    flexDirection: 'row',
    height: 32,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timelineScroll: { flex: 1 },
  gridBody: { flex: 1 },
  masterScroll: { height: 0, opacity: 0, position: 'absolute' },
  rowsWrapper: { flex: 1, flexDirection: 'row' },
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
});
