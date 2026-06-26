/**
 * Purpose: Floating controls overlay for nTV media player.
 *          Loading/error/offline state views extracted to PlayerStateOverlays.tsx.
 *
 * Inputs:  MediaPlayerState + callbacks from useMediaPlayer.
 * Outputs: play/pause, seek, volume, fullscreen, PiP, quality picker overlay.
 *
 * Constraints:
 *   - No media logic — all state from hook; QualityPicker in QualityPicker.tsx.
 *   - All strings i18n-wrapped via useNselfTranslation.
 *   - Accessibility labels on all interactive elements.
 *   - State overlays (loading/error/offline) live in PlayerStateOverlays.tsx.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv media-player feature; T-P3-E4-W2-S4-T08
 */

import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNselfTranslation } from '@nself/i18n';
import type {
  MediaPlayerControls,
  MediaPlayerState,
} from '../hooks/useMediaPlayer';
import { QualityPicker } from './QualityPicker';
import {
  BufferingOverlay,
  ErrorOverlay,
  OfflineOverlay,
} from './PlayerStateOverlays';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerControlsProps = MediaPlayerState &
  Pick<
    MediaPlayerControls,
    | 'play'
    | 'pause'
    | 'seek'
    | 'setVolume'
    | 'toggleFullscreen'
    | 'togglePiP'
    | 'retry'
    | 'selectQuality'
    | 'showControlsFor'
  >;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerControls(props: PlayerControlsProps) {
  const { t } = useNselfTranslation();
  const {
    uiState,
    isPlaying,
    isFullscreen,
    currentTime,
    duration,
    buffered,
    volume,
    errorMessage,
    qualities,
    selectedQualityIndex,
    showControls,
    play,
    pause,
    seek,
    setVolume,
    toggleFullscreen,
    togglePiP,
    retry,
    selectQuality,
    showControlsFor,
  } = props;

  const [showQualityPicker, setShowQualityPicker] = useState(false);

  const handleOverlayPress = useCallback(() => showControlsFor(3000), [showControlsFor]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) pause(); else play();
    showControlsFor(3000);
  }, [isPlaying, play, pause, showControlsFor]);

  const handleSeek = useCallback(
    (value: number) => { seek(value); showControlsFor(3000); },
    [seek, showControlsFor],
  );

  if (uiState === 'buffering' || uiState === 'loading') {
    return <BufferingOverlay />;
  }

  if (uiState === 'error') {
    return (
      <ErrorOverlay
        errorTitle={t('streamUnavailable')}
        errorMessage={errorMessage ?? t('unableToLoadStream')}
        retryLabel={t('retry')}
        onRetry={retry}
      />
    );
  }

  if (uiState === 'offline') {
    return (
      <OfflineOverlay
        noConnectionLabel={t('noConnection')}
        checkInternetLabel={t('checkInternet')}
        retryLabel={t('retry')}
        onRetry={retry}
      />
    );
  }

  const controlsVisible = showControls || !isPlaying;
  const activeQualityLabel =
    selectedQualityIndex === -1
      ? t('auto')
      : (qualities.find((q) => q.trackIndex === selectedQualityIndex)?.label ?? 'Q');

  return (
    <TouchableWithoutFeedback onPress={handleOverlayPress}>
      <View style={styles.container}>
        {showQualityPicker && qualities.length > 0 && (
          <QualityPicker
            qualities={qualities}
            selectedQualityIndex={selectedQualityIndex}
            onSelect={selectQuality}
            onClose={() => setShowQualityPicker(false)}
          />
        )}

        {controlsVisible && (
          <View style={styles.overlay}>
            {/* Top row: PiP + Quality */}
            <View style={styles.topRow}>
              {Platform.OS !== 'web' && (
                <Pressable
                  style={styles.iconBtn}
                  onPress={togglePiP}
                  accessibilityRole="button"
                  accessibilityLabel={t('pipMode')}
                >
                  <Text style={styles.iconText}>⧉</Text>
                </Pressable>
              )}
              {qualities.length > 0 && (
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => setShowQualityPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('quality')}: ${activeQualityLabel}`}
                >
                  <Text style={styles.iconText}>{activeQualityLabel}</Text>
                </Pressable>
              )}
            </View>

            {/* Center: play/pause */}
            <Pressable
              style={styles.playPauseBtn}
              onPress={handlePlayPause}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? t('pause') : t('play')}
            >
              <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>

            {/* Bottom row: time + seek + volume + fullscreen */}
            <View style={styles.bottomRow}>
              <Text style={styles.timeText} accessibilityLabel={`${t('seek')}: ${formatTime(currentTime)}`}>{formatTime(currentTime)}</Text>

              <View style={styles.seekWrap}>
                <Slider
                  style={styles.seekSlider}
                  minimumValue={0}
                  maximumValue={duration > 0 ? duration : 1}
                  value={currentTime}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor="#E53E3E"
                  maximumTrackTintColor="rgba(255,255,255,0.4)"
                  thumbTintColor="#E53E3E"
                  accessibilityLabel={t('seek')}
                />
                {duration > 0 && (
                  <View
                    style={[
                      styles.bufferedBar,
                      { width: `${Math.min((buffered / duration) * 100, 100)}%` },
                    ]}
                    pointerEvents="none"
                  />
                )}
              </View>

              <Text style={styles.timeText} accessibilityLabel={`${t('seek')}: ${formatTime(duration)}`}>{formatTime(duration)}</Text>

              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255,255,255,0.4)"
                thumbTintColor="#FFFFFF"
                accessibilityLabel={t('volume')}
              />

              <Pressable
                style={styles.iconBtn}
                onPress={toggleFullscreen}
                accessibilityRole="button"
                accessibilityLabel={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
              >
                <Text style={styles.iconText}>{isFullscreen ? '⊡' : '⤢'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  playPauseBtn: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: { color: '#FFFFFF', fontSize: 28 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { color: '#FFFFFF', fontSize: 12, minWidth: 40, textAlign: 'center' },
  seekWrap: { flex: 1, position: 'relative' },
  seekSlider: { flex: 1, height: 20 },
  bufferedBar: {
    position: 'absolute',
    left: 16,
    top: 9,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  volumeSlider: { width: 80, height: 20 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  iconText: { color: '#FFFFFF', fontSize: 18 },
});
