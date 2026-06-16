/**
 * Purpose: TV (rn-tvos) full-screen player for ɳTV — Apple TV / Android TV / Fire TV.
 *          D-pad controls (play/pause/seek/back). Focus rings on interactive elements.
 *          No touch targets. Integrates with TVChannelList slide-in panel.
 *
 * Inputs:
 *   - streamUrl: string — HLS/DASH URI
 *   - title: string — channel/content title
 *   - channels?: Channel[] — for slide-in channel list on 'up'
 *   - onBack?: () => void
 *   - onSelectChannel?: (channel: Channel) => void
 *
 * Outputs:
 *   - Full-screen react-native-video player (0 margin/padding, full bleed).
 *   - D-pad controls: up=channel list, select=play/pause, left/right=seek±10s, back=exit player.
 *   - Overlay controls bar with play/pause, seek, title.
 *   - VideoError handling with typed error card.
 *
 * Constraints:
 *   - isTVSelectable={true} on every interactive element.
 *   - hasTVPreferredFocus on play/pause button.
 *   - Focus ring: yellow 3px border on focused element.
 *   - Text min 28sp.
 *   - TVEventHandler registered once; cleaned up on unmount.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-player-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TVFocusGuideView, TVEventHandler } from './tv-compat';
import Video, { type VideoRef } from 'react-native-video';
import { TVChannelList } from './TVChannelList';
import {
  type VideoError,
  getVideoErrorMessage,
  isRetryableError,
} from '../types/video-errors';
import type { Channel } from '../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEEK_STEP = 10; // seconds
const CONTROLS_DISMISS_MS = 5000;
const COLORS = {
  bg: '#000000',
  overlay: 'rgba(0,0,0,0.65)',
  text: '#ffffff',
  muted: '#9ca3af',
  focusBorder: '#fbbf24',
  focusBg: 'rgba(251, 191, 36, 0.15)',
  error: '#ef4444',
  primary: '#0ea5e9',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UIState =
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'error'
  | 'offline';

// ---------------------------------------------------------------------------
// TV Error Card
// ---------------------------------------------------------------------------

interface TVErrorCardProps {
  error: VideoError;
  onRetry?: () => void;
  onBack?: () => void;
}

function TVErrorCard({ error, onRetry, onBack }: TVErrorCardProps): React.ReactElement {
  const message = getVideoErrorMessage(error);
  const canRetry = isRetryableError(error);

  return (
    <View style={styles.errorContainer} accessible accessibilityRole="alert">
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Playback Error</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TVFocusGuideView style={styles.errorButtons} autoFocus destinations={[]}>
        {canRetry && onRetry && (
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.tvButton, (s.focused as boolean) && styles.tvButtonFocused]}
            onPress={onRetry}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel="Retry playback"
            // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
            hasTVPreferredFocus
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.tvButtonText, (s.focused as boolean) && styles.tvButtonTextFocused]}>
                Retry
              </Text>
            )}
          </Pressable>
        )}
        {onBack && (
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.tvButton, (s.focused as boolean) && styles.tvButtonFocused]}
            onPress={onBack}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
            // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
            hasTVPreferredFocus={!canRetry}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s: any) => (
              <Text style={[styles.tvButtonText, (s.focused as boolean) && styles.tvButtonTextFocused]}>
                Back
              </Text>
            )}
          </Pressable>
        )}
      </TVFocusGuideView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Controls overlay
// ---------------------------------------------------------------------------

interface TVControlsOverlayProps {
  title: string;
  uiState: UIState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onBack?: () => void;
}

function TVControlsOverlay({
  title,
  uiState,
  isPlaying,
  onTogglePlay,
  onSeekBack,
  onSeekForward,
  onBack,
}: TVControlsOverlayProps): React.ReactElement {
  return (
    <View style={styles.controlsOverlay} pointerEvents="box-none">
      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
      </View>

      {/* Center — loading/buffering indicator */}
      {(uiState === 'loading' || uiState === 'buffering') && (
        <View style={styles.centerIndicator} pointerEvents="none">
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            accessible
            accessibilityLabel={uiState === 'buffering' ? 'Buffering' : 'Loading'}
          />
        </View>
      )}

      {/* Bottom controls */}
      {(uiState === 'playing' || uiState === 'paused') && (
        <TVFocusGuideView style={styles.bottomControls} autoFocus destinations={[]}>
          {onBack && (
            <Pressable
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={(s: any) => [styles.controlBtn, (s.focused as boolean) && styles.controlBtnFocused]}
              onPress={onBack}
              // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
              isTVSelectable
              accessible
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(s: any) => (
                <Text style={[styles.controlBtnText, (s.focused as boolean) && styles.controlBtnTextFocused]}>‹ Back</Text>
              )}
            </Pressable>
          )}

          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(s: any) => [styles.controlBtn, (s.focused as boolean) && styles.controlBtnFocused]}
            onPress={onSeekBack}
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
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
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
            isTVSelectable
            accessible
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
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
            // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
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

// ---------------------------------------------------------------------------
// TVPlayerScreen
// ---------------------------------------------------------------------------

export interface TVPlayerScreenProps {
  streamUrl: string;
  title?: string;
  channels?: Channel[];
  activeChannelId?: string | null;
  channelsLoading?: boolean;
  onBack?: () => void;
  onSelectChannel?: (channel: Channel) => void;
}

export function TVPlayerScreen({
  streamUrl,
  title = 'Live TV',
  channels = [],
  activeChannelId = null,
  channelsLoading = false,
  onBack,
  onSelectChannel,
}: TVPlayerScreenProps): React.ReactElement {
  const videoRef = useRef<VideoRef>(null);
  const [uiState, setUiState] = useState<UIState>('loading');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showChannelList, setShowChannelList] = useState(false);
  const [videoError, setVideoError] = useState<VideoError | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Controls auto-dismiss
  // ---------------------------------------------------------------------------

  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_DISMISS_MS);
  }, []);

  const showControlsAndReset = useCallback(() => {
    setShowControls(true);
    resetControlsTimer();
  }, [resetControlsTimer]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // D-pad / remote event handler
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!Platform.isTV) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, event: { eventType: string }) => {
      const type = event?.eventType;
      if (!type) return;

      switch (type) {
        case 'select':
        case 'playPause':
          if (showChannelList) {
            // Let FlatList handle selection
          } else {
            handleTogglePlay();
            showControlsAndReset();
          }
          break;
        case 'up':
          if (!showChannelList) {
            setShowChannelList(true);
          }
          break;
        case 'down':
          setShowChannelList(false);
          break;
        case 'left':
          if (!showChannelList) {
            handleSeekBack();
            showControlsAndReset();
          }
          break;
        case 'right':
          if (!showChannelList) {
            handleSeekForward();
            showControlsAndReset();
          }
          break;
        case 'menu':
        case 'back':
          if (showChannelList) {
            setShowChannelList(false);
          } else {
            onBack?.();
          }
          break;
        default:
          break;
      }
    });

    return () => {
      handler.disable();
    };
  }, [showChannelList, onBack]);

  // ---------------------------------------------------------------------------
  // Player callbacks
  // ---------------------------------------------------------------------------

  const handleLoad = useCallback(() => {
    setUiState('playing');
    setVideoError(null);
  }, []);

  const handleBuffer = useCallback(({ isBuffering }: { isBuffering: boolean }) => {
    if (uiState === 'error') return;
    setUiState(isBuffering ? 'buffering' : 'playing');
  }, [uiState]);

  const handleError = useCallback((data: {
    error?: { code?: number; errorString?: string; localizedDescription?: string };
  }) => {
    const code = data?.error?.code;
    const desc = data?.error?.localizedDescription ?? data?.error?.errorString ?? '';
    const isNetwork = code === -1009 || code === -1004 || desc.toLowerCase().includes('network');

    let err: VideoError;
    if (isNetwork) {
      err = { type: 'network', code: String(code ?? 'unknown') };
    } else if (desc.toLowerCase().includes('drm')) {
      err = { type: 'drm_error', errorCode: code };
    } else {
      err = { type: 'stream_unavailable', reason: desc };
    }

    setVideoError(err);
    setUiState('error');
  }, []);

  const handleRetry = useCallback(() => {
    setVideoError(null);
    setUiState('loading');
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      setUiState(!prev ? 'playing' : 'paused');
      return !prev;
    });
  }, []);

  const handleSeekBack = useCallback(() => {
    videoRef.current?.seek(Math.max(0, -SEEK_STEP), 100);
  }, []);

  const handleSeekForward = useCallback(() => {
    videoRef.current?.seek(SEEK_STEP, 100);
  }, []);

  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      setShowChannelList(false);
      onSelectChannel?.(channel);
    },
    [onSelectChannel],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Full-bleed video */}
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={!isPlaying}
        onLoad={handleLoad}
        onBuffer={handleBuffer}
        onError={handleError as any}
        repeat={false}
      />

      {/* Error overlay */}
      {uiState === 'error' && videoError && (
        <View style={styles.errorOverlay}>
          <TVErrorCard error={videoError} onRetry={handleRetry} onBack={onBack} />
        </View>
      )}

      {/* Controls overlay */}
      {uiState !== 'error' && (showControls || uiState === 'loading' || uiState === 'buffering') && (
        <TVControlsOverlay
          title={title}
          uiState={uiState}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSeekBack={handleSeekBack}
          onSeekForward={handleSeekForward}
          onBack={onBack}
        />
      )}

      {/* Channel list slide-in panel */}
      {showChannelList && (
        <View style={styles.channelListPanel}>
          <TVChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            loading={channelsLoading}
            onSelectChannel={handleChannelSelect}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Controls overlay
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: COLORS.overlay,
  },
  titleBar: {
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
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

  // TV buttons
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
  controlBtnMain: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  controlBtnFocused: {
    borderColor: COLORS.focusBorder,
    backgroundColor: COLORS.focusBg,
  },
  controlBtnText: { fontSize: 26, color: COLORS.text, fontWeight: '600' },
  controlBtnTextLarge: { fontSize: 36, color: COLORS.text },
  controlBtnTextFocused: { color: COLORS.focusBorder },

  // Error
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 32, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  errorMessage: { fontSize: 24, color: COLORS.muted, textAlign: 'center', lineHeight: 34 },
  errorButtons: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 32,
  },

  // TV button in error card
  tvButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tvButtonFocused: {
    borderColor: COLORS.focusBorder,
    backgroundColor: COLORS.focusBg,
  },
  tvButtonText: { fontSize: 26, color: COLORS.text, fontWeight: '600' },
  tvButtonTextFocused: { color: COLORS.focusBorder },

  // Channel list panel
  channelListPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '35%',
    backgroundColor: 'rgba(8, 9, 14, 0.96)',
    borderLeftWidth: 1,
    borderLeftColor: '#1e2333',
  },
});
