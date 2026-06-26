/**
 * Purpose: ChannelRow sub-component for the nTV Apple TV favorites panel.
 *          Extracted from FavoritesPanel.tsx to keep that file under 300 lines.
 *
 * Inputs:
 *   channel — TVChannel to display.
 *   isFirst — whether to receive hasTVPreferredFocus.
 *   onPress — called when the user selects the channel.
 *
 * Outputs: Pressable TV-focusable row with initial-logo, name, and play indicator.
 *
 * Constraints:
 *   - TV-only: hasTVPreferredFocus on first row; no touch targets.
 *   - Text ≥24pt; contrast ≥6:1 against panel background (slate-900).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS favorites panel row
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TVChannel } from '@/screens/HomeScreen';

export interface FavoritesPanelRowProps {
  channel: TVChannel;
  isFirst: boolean;
  onPress: (channel: TVChannel) => void;
}

export function FavoritesPanelRow({ channel, isFirst, onPress }: FavoritesPanelRowProps) {
  const handlePress = useCallback(() => onPress(channel), [channel, onPress]);

  return (
    <Pressable
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — hasTVPreferredFocus is react-native-tvos only
      hasTVPreferredFocus={isFirst}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
      style={({ focused }: { focused: boolean }) => [
        styles.row,
        focused ? styles.rowFocused : null,
      ]}
      onPress={handlePress}
      accessibilityLabel={`Play ${channel.name}`}
    >
      <View style={styles.rowLogo}>
        <Text style={styles.rowLogoInitial}>{channel.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.rowName} numberOfLines={1}>{channel.name}</Text>
      <Text style={styles.rowPlay}>▶</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowFocused: {
    backgroundColor: '#1e293b',
    borderColor: '#0ea5e9',
    transform: [{ scale: 1.02 }],
  },
  rowLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  rowLogoInitial: { fontSize: 24, fontWeight: '700', color: '#f9fafb' },
  rowName: { flex: 1, fontSize: 26, fontWeight: '500', color: '#f1f5f9' },
  rowPlay: { fontSize: 20, color: '#38bdf8', marginLeft: 12 },
});
