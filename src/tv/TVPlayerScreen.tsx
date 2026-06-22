/**
 * Purpose: TV (rn-tvos) full-screen player for ɳTV — Apple TV / Android TV / Fire TV.
 *          D-pad controls (play/pause/seek/back). Focus rings on interactive elements.
 *          No touch targets. Integrates with TVChannelList slide-in panel.
 *
 * Inputs:
 *   streamUrl        — HLS/DASH URI to play.
 *   title?           — channel/content title for the overlay (default "Live TV").
 *   channels?        — list of channels for the slide-in channel list (triggered by D-pad up).
 *   activeChannelId? — currently playing channel id, highlighted in TVChannelList.
 *   channelsLoading? — whether channel list data is still loading.
 *   onBack?          — called when the user presses Back.
 *   onSelectChannel? — called when user selects a new channel from the list.
 *
 * Outputs:
 *   Full-screen react-native-video player with TVControlsOverlay, TVErrorCard,
 *   and TVChannelList slide-in panel.
 *
 * Constraints:
 *   - TVEventHandler registered once, cleaned up on unmount.
 *   - D-pad: up=open channel list, down=close, left=seek back, right=seek forward,
 *     select/playPause=toggle play, menu/back=back or close panel.
 *   - Controls auto-dismiss after CONTROLS_DISMISS_MS ms of inactivity.
 *   - Text min 28sp; focus ring: focusBorder 3px.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-player-screen; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { TVEventHandler } from './tv-compat';
import Video, { type VideoRef } from 'react-native-video';
import { TVChannelList } from './TVChannelList';
import { TVErrorCard } from './TVErrorCard';
import { TVControlsOverlay } from './TVControlsOverlay';
import { TV_COLORS as C, SEEK_STEP, CONTROLS_DISMISS_MS } from './TVPlayerColors';
import type { VideoError } from '../types/video-errors';
import type { Channel } from '../../services/m3u-parser';

// ─── Types ────────────────────────────────────────────────────────────────────

type UIState = 'loading' | 'buffering' | 'playing' | 'paused' | 'error' | 'offline';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TVPlayerScreenProps {
  streamUrl: string;
  title?: string;
  channels?: Channel[];
  activeChannelId?: string | null;
  channelsLoading?: boolean;
  onBack?: () => void;
  onSelectChannel?: (channel: Channel) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  // Playback position/duration in refs to avoid re-rendering on every progress tick.
  const currentPositionRef = useRef(0);
  const durationRef = useRef(0);

  // ─── Controls auto-dismiss ─────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), CONTROLS_DISMISS_MS);
  }, []);

  const showControlsAndReset = useCallback(() => {
    setShowControls(true);
    resetControlsTimer();
  }, [resetControlsTimer]);

  useEffect(() => () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  // ─── D-pad / remote event handler ─────────────────────────────────────────

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      setUiState(!prev ? 'playing' : 'paused');
      return !prev;
    });
  }, []);

  const handleSeekBack = useCallback(() => {
    const target = Math.max(0, currentPositionRef.current - SEEK_STEP);
    currentPositionRef.current = target;
    videoRef.current?.seek(target, 100);
  }, []);

  const handleSeekForward = useCallback(() => {
    const max = durationRef.current > 0 ? durationRef.current : Number.MAX_SAFE_INTEGER;
    const target = Math.min(max, currentPositionRef.current + SEEK_STEP);
    currentPositionRef.current = target;
    videoRef.current?.seek(target, 100);
  }, []);

  useEffect(() => {
    if (!Platform.isTV) return;
    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, event: { eventType: string }) => {
      const type = event?.eventType;
      if (!type) return;
      switch (type) {
        case 'select':
        case 'playPause':
          if (!showChannelList) { handleTogglePlay(); showControlsAndReset(); }
          break;
        case 'up':
          if (!showChannelList) setShowChannelList(true);
          break;
        case 'down':
          setShowChannelList(false);
          break;
        case 'left':
          if (!showChannelList) { handleSeekBack(); showControlsAndReset(); }
          break;
        case 'right':
          if (!showChannelList) { handleSeekForward(); showControlsAndReset(); }
          break;
        case 'menu':
        case 'back':
          if (showChannelList) setShowChannelList(false);
          else onBack?.();
          break;
        default:
          break;
      }
    });
    return () => handler.disable();
  }, [showChannelList, onBack, handleTogglePlay, handleSeekBack, handleSeekForward, showControlsAndReset]);

  // ─── Player callbacks ──────────────────────────────────────────────────────

  const handleLoad = useCallback((data?: { duration?: number; currentTime?: number }) => {
    if (typeof data?.duration === 'number') durationRef.current = data.duration;
    if (typeof data?.currentTime === 'number') currentPositionRef.current = data.currentTime;
    setUiState('playing');
    setVideoError(null);
  }, []);

  const handleProgress = useCallback(
    (data: { currentTime: number; seekableDuration?: number }) => {
      currentPositionRef.current = data.currentTime;
      if (typeof data.seekableDuration === 'number' && data.seekableDuration > 0) {
        durationRef.current = data.seekableDuration;
      }
    },
    [],
  );

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

  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      setShowChannelList(false);
      onSelectChannel?.(channel);
    },
    [onSelectChannel],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={!isPlaying}
        onLoad={handleLoad as any}
        onProgress={handleProgress as any}
        onBuffer={handleBuffer}
        onError={handleError as any}
        repeat={false}
      />

      {uiState === 'error' && videoError && (
        <View style={styles.errorOverlay}>
          <TVErrorCard error={videoError} onRetry={handleRetry} onBack={onBack} />
        </View>
      )}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
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
