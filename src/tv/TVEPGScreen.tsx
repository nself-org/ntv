/**
 * Purpose: TV (rn-tvos) EPG screen for ɳTV — horizontal timeline grid adapted for 10-foot
 *          D-pad navigation. Focus rings on all interactive cells.
 *          Sub-components (ProgramCell, EPGChannelRow) extracted to TVEPGComponents.tsx.
 *
 * Inputs:
 *   - channels: EPGChannel[] — channel list with logos
 *   - programs: EPGProgram[] — programme schedule data
 *   - startTime: Date — visible window start (default: 30 min before now)
 *   - onSelectProgram?: (program: EPGProgram) => void
 *
 * Outputs:
 *   - Horizontal + vertical scrollable EPG grid.
 *   - D-pad navigable: left/right = time, up/down = channel.
 *   - Empty state when no channels provided.
 *
 * Constraints:
 *   - isTVSelectable={true} on every programme cell (in TVEPGComponents).
 *   - hasTVPreferredFocus on the first programme of the first channel.
 *   - Text min 24sp for TV readability.
 *   - No touch handlers.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-epg-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EPGChannel, EPGProgram } from '../../hooks/useEPG';
import {
  COLORS,
  EPGChannelRow,
} from './TVEPGComponents';

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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  emptyText: { fontSize: 28, color: COLORS.muted, textAlign: 'center' },
  emptySubText: { fontSize: 22, color: COLORS.muted, textAlign: 'center', marginTop: 12 },
});
