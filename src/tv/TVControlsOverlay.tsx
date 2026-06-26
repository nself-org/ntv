/**
 * Purpose: D-pad controls overlay for the ɳTV TV player — title bar, loading indicator,
 *          and play/pause/seek/back button row.
 *
 * Inputs:
 *   title        — channel/content title shown in the top bar.
 *   uiState      — current player state: loading | buffering | playing | paused | error | offline.
 *   isPlaying    — whether the video is currently playing.
 *   onTogglePlay — toggles play/pause.
 *   onSeekBack   — seeks back SEEK_STEP seconds.
 *   onSeekForward — seeks forward SEEK_STEP seconds.
 *   onBack?      — navigates back; renders a Back button if provided.
 *
 * Outputs:
 *   Absolutely positioned overlay with title bar (top), spinner (center, loading/buffering),
 *   and controls row (bottom, playing/paused only).
 *
 * Constraints:
 *   - isTVSelectable on all Pressable elements.
 *   - hasTVPreferredFocus on play/pause button.
 *   - Text >= 28pt for TV readability.
 *   - No touch gestures.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-controls-overlay
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import { TV_COLORS as C, SEEK_STEP } from './TVPlayerColors';

type UIState = 'loading' | 'buffering' | 'playing' | 'paused' | 'error' | 'offline';

export interface TVControlsOverlayProps {
  title: string;
  uiState: UIState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onBack?: () => void;
}

/** Transparent overlay rendering TV player controls over the video. */
export function TVControlsOverlay({
  title,
  uiState,
  isPlaying,
  onTogglePlay,
  onSeekBack,
  onSeekForward,
  onBack,
}: TVControlsOverlayProps): React.ReactElement {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
      </View>

      {/* Center — loading/buffering indicator */}
      {(uiState === 'loading' || uiState === 'buffering') && (
        <View style={styles.centerIndicator} pointerEvents="none">
          <ActivityIndicator
            size="large"
            color={C.primary}
            accessible
            accessibilityLabel={uiState === 'buffering' ? 'Buffering' : 'Loading'}
          />
        </View>
      )}

      {/* Bottom controls — shown while playing or paused */}
      {(uiState === 'playing' || uiState === 'paused') && (
        <TVFocusGuideView style={styles.bottomControls} autoFocus destinations={[]}>
          {onBack && (
            <Pressable
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={(s: any) => [styles.controlBtn, (s.focused as boolean) && styles.controlBtnFocused]}
              onPress={onBack}
              // @ts-ignore — isTVSelectable is a react-native-tvos prop
              isTVSelectable
              accessible
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(s: any) => (
                <Text style={[styles.controlBtnText, (s.focused as boolean) && styles.controlBtnTextFocused]}>
                  ‹ Back
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.controlBtn, (s.focused as boolean) && styles.controlBtnFocused]}
            onPress={onSeekBack}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Seek back ${SEEK_STEP} seconds`}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.controlBtnText, (s.focused as boolean) && styles.controlBtnTextFocused]}>
                ⟨ {SEEK_STEP}s
              </Text>
            )}
          </Pressable>

          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.controlBtn, styles.controlBtnMain, (s.focused as boolean) && styles.controlBtnFocused]}
            onPress={onTogglePlay}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop
            hasTVPreferredFocus
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.controlBtnTextLarge, (s.focused as boolean) && styles.controlBtnTextFocused]}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </Pressable>

          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.controlBtn, (s.focused as boolean) && styles.controlBtnFocused]}
            onPress={onSeekForward}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Seek forward ${SEEK_STEP} seconds`}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.controlBtnText, (s.focused as boolean) && styles.controlBtnTextFocused]}>
                {SEEK_STEP}s ⟩
              </Text>
            )}
          </Pressable>
        </TVFocusGuideView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: C.overlay,
  },
  titleBar: { paddingTop: 48, paddingHorizontal: 40 },
  titleText: { fontSize: 32, fontWeight: '700', color: C.text },
  centerIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
    paddingHorizontal: 40,
    gap: 20,
  },
  controlBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.15)',
    minWidth: 80,
    alignItems: 'center',
  },
  controlBtnMain: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  controlBtnFocused: { borderColor: C.focusBorder, backgroundColor: C.focusBg },
  controlBtnText: { fontSize: 26, color: C.text, fontWeight: '600' },
  controlBtnTextLarge: { fontSize: 36, color: C.text },
  controlBtnTextFocused: { color: C.focusBorder },
});
