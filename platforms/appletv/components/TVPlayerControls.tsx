/**
 * Purpose: TV controls overlay for nTV Apple TV / Android TV player.
 * Inputs: TVPlayerState + TVPlayerControls from useTVPlayer; currentProgramTitle from EPG prop.
 * Outputs: Absolute overlay with play/pause, channel up/down, seek bar, channel info.
 *          Triggered by remote 'select'; auto-dismisses after 5s (managed by useTVPlayer).
 * Constraints: TV-only — no touch handlers; all navigation via TVEventHandler in PlayerScreen.
 *              hasTVPreferredFocus on play/pause button so remote lands there by default.
 *              No safe-area padding (TV is full-bleed by design).
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS player controls (T-P3-E4-W2-S5-T02)
 */

import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TVPlayerState, TVPlayerControls } from '../hooks/useTVPlayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TVPlayerControlsProps = Pick<
  TVPlayerState,
  | 'uiState'
  | 'isPlaying'
  | 'currentTime'
  | 'duration'
  | 'buffered'
  | 'controlsVisible'
  | 'errorMessage'
> &
  Pick<TVPlayerControls, 'togglePlayPause' | 'retry'> & {
    /** Current program title from EPG; shown bottom-left while player is active */
    currentProgramTitle?: string;
    /** Handler for channel up (mapped to D-pad up in PlayerScreen) */
    onChannelUp?: () => void;
    /** Handler for channel down (mapped to D-pad down in PlayerScreen) */
    onChannelDown?: () => void;
  };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the TV player overlay. The component is always mounted but only
 * visible when controlsVisible === true (or on error/buffering states).
 * TVEventHandler lives in PlayerScreen — this component is purely presentational.
 */
export function TVPlayerControls({
  uiState,
  isPlaying,
  currentTime,
  duration,
  buffered,
  controlsVisible,
  errorMessage,
  currentProgramTitle,
  onChannelUp,
  onChannelDown,
  togglePlayPause,
  retry,
}: TVPlayerControlsProps) {
  // --- Buffering / Loading spinner (always shown, no interaction needed) ---
  if (uiState === 'buffering' || uiState === 'loading') {
    return (
      <View style={styles.bufferingOverlay} pointerEvents="none">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // --- Error overlay ---
  if (uiState === 'error') {
    return (
      <View style={styles.errorOverlay}>
        <Text style={styles.errorTitle}>Stream Unavailable</Text>
        <Text style={styles.errorMessage}>
          {errorMessage ?? 'Unable to load stream. Check your connection.'}
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={retry}
          // hasTVPreferredFocus so remote 'select' goes straight to retry
          hasTVPreferredFocus
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // --- Normal playback: channel info always visible; controls conditional ---
  return (
    <View style={styles.root} pointerEvents={controlsVisible ? 'box-none' : 'none'}>
      {/* Channel info — bottom-left, always visible during playback */}
      {currentProgramTitle != null && currentProgramTitle.length > 0 && (
        <View style={styles.channelInfo} pointerEvents="none">
          <Text style={styles.programTitle} numberOfLines={1}>
            {currentProgramTitle}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(currentTime)}
            {duration > 0 ? ` / ${formatTime(duration)}` : ''}
          </Text>
        </View>
      )}

      {/* Controls overlay — visible only when controlsVisible */}
      {controlsVisible && (
        <View style={styles.controlsOverlay}>
          {/* Seek bar */}
          <View style={styles.seekBarContainer} pointerEvents="none">
            {/* Buffered track */}
            <View
              style={[
                styles.seekTrack,
                {
                  width:
                    duration > 0
                      ? `${Math.min(100, (buffered / duration) * 100)}%`
                      : '0%',
                },
              ]}
            />
            {/* Progress track */}
            <View
              style={[
                styles.seekProgress,
                {
                  width:
                    duration > 0
                      ? `${Math.min(100, (currentTime / duration) * 100)}%`
                      : '0%',
                },
              ]}
            />
          </View>

          {/* Control buttons row */}
          <View style={styles.buttonsRow}>
            {/* Channel Down */}
            <Pressable
              style={styles.channelBtn}
              onPress={onChannelDown}
              accessibilityRole="button"
              accessibilityLabel="Channel Down"
            >
              <Text style={styles.channelBtnText}>▼</Text>
            </Pressable>

            {/* Play / Pause — hasTVPreferredFocus: remote lands here by default */}
            <Pressable
              style={[styles.playPauseBtn, isPlaying ? styles.pauseStyle : styles.playStyle]}
              onPress={togglePlayPause}
              // hasTVPreferredFocus only valid on tvOS/Android TV (Platform.isTV)
              hasTVPreferredFocus={Platform.isTV}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              <Text style={styles.playPauseText}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>

            {/* Channel Up */}
            <Pressable
              style={styles.channelBtn}
              onPress={onChannelUp}
              accessibilityRole="button"
              accessibilityLabel="Channel Up"
            >
              <Text style={styles.channelBtnText}>▲</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 40,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#CCCCCC',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  channelInfo: {
    position: 'absolute',
    bottom: 40,
    left: 48,
    maxWidth: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  programTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  timeText: {
    color: '#CCCCCC',
    fontSize: 18,
    marginTop: 4,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  seekBarContainer: {
    height: 6,
    marginHorizontal: 60,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  seekTrack: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 3,
  },
  seekProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  playPauseBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playStyle: {
    backgroundColor: '#E50914',
  },
  pauseStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playPauseText: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  channelBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelBtnText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
});
