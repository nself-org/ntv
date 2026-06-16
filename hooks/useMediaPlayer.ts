/**
 * Purpose: Core media player state machine for nTV.
 * Inputs: initialUri — stream URL. Outputs: PlayerState + controls for PlayerControls + player.tsx.
 * Constraints: all media logic here, no state in JSX; cleans up on unmount.
 * 7 UI states: loading | buffering | playing | paused | error | offline | success
 * SPORT: F12-REPO-TYPE-MAP.md — ntv media-player feature status updated
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ensureTrackPlayer,
  pauseTrackPlayerIfPlaying,
  stopTrackPlayer,
  syncTrackPlayer,
} from './useTrackPlayerSync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MediaPlayerUIState =
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'error'
  | 'offline'
  | 'success';

export type StreamQuality = {
  label: string;
  bitrate?: number;
  width?: number;
  height?: number;
  trackIndex: number;
};

export type MediaPlayerState = {
  uiState: MediaPlayerUIState;
  isPlaying: boolean;
  isFullscreen: boolean;
  isPiP: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  errorMessage: string | null;
  qualities: StreamQuality[];
  selectedQualityIndex: number;
  showControls: boolean;
};

export type MediaPlayerControls = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleFullscreen: () => Promise<void>;
  togglePiP: () => void;
  retry: () => void;
  selectQuality: (index: number) => void;
  showControlsFor: (ms?: number) => void;
  onVideoBuffer: (meta: { isBuffering: boolean }) => void;
  onVideoError: (error: { error: { code?: string; localizedDescription?: string } }) => void;
  onVideoProgress: (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => void;
  onVideoLoad: (data: { duration: number }) => void;
  onVideoEnd: () => void;
};

export type UseMediaPlayerReturn = MediaPlayerState &
  MediaPlayerControls & {
    videoRef: React.MutableRefObject<unknown>;
  };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediaPlayer(initialUri?: string): UseMediaPlayerReturn {
  const videoRef = useRef<unknown>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUri = useRef<string | undefined>(initialUri);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const [state, setState] = useState<MediaPlayerState>({
    uiState: initialUri ? 'loading' : 'offline',
    isPlaying: false,
    isFullscreen: false,
    isPiP: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    errorMessage: null,
    qualities: [],
    selectedQualityIndex: -1,
    showControls: true,
  });

  const patch = useCallback((updates: Partial<MediaPlayerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // TrackPlayer setup
  useEffect(() => {
    ensureTrackPlayer();
  }, []);

  // ---------------------------------------------------------------------------
  // AppState: background → TrackPlayer handoff + PiP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      const wasActive = appStateRef.current === 'active';
      const isBackground = next === 'background' || next === 'inactive';
      appStateRef.current = next;

      if (wasActive && isBackground && currentUri.current && state.isPlaying) {
        await syncTrackPlayer(currentUri.current, true);
        // Android PiP: triggered by Video pictureInPicture prop on background
      }

      if (next === 'active') {
        await pauseTrackPlayerIfPlaying();
      }
    });

    return () => sub.remove();
  }, [state.isPlaying]);

  // ---------------------------------------------------------------------------
  // Controls hide timer
  // ---------------------------------------------------------------------------

  const clearHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  const showControlsFor = useCallback(
    (ms = 3000) => {
      clearHideTimer();
      patch({ showControls: true });
      if (ms > 0) {
        hideControlsTimer.current = setTimeout(() => {
          patch({ showControls: false });
        }, ms);
      }
    },
    [clearHideTimer, patch],
  );

  useEffect(() => {
    showControlsFor(3000);
    return () => clearHideTimer();
  }, [showControlsFor, clearHideTimer]);

  // ---------------------------------------------------------------------------
  // Video event handlers
  // ---------------------------------------------------------------------------

  const onVideoBuffer = useCallback(
    ({ isBuffering }: { isBuffering: boolean }) => {
      patch({ uiState: isBuffering ? 'buffering' : (state.isPlaying ? 'playing' : 'paused') });
    },
    [patch, state.isPlaying],
  );

  const onVideoError = useCallback(
    (error: { error: { code?: string; localizedDescription?: string } }) => {
      patch({
        uiState: 'error',
        isPlaying: false,
        errorMessage:
          error?.error?.localizedDescription ?? error?.error?.code ?? 'Stream unavailable',
      });
    },
    [patch],
  );

  const onVideoProgress = useCallback(
    (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
      patch({
        currentTime: data.currentTime,
        buffered: data.playableDuration,
        duration: data.seekableDuration > 0 ? data.seekableDuration : state.duration,
      });
    },
    [patch, state.duration],
  );

  const onVideoLoad = useCallback(
    (data: { duration: number }) => {
      patch({ uiState: 'success', duration: data.duration, errorMessage: null });
    },
    [patch],
  );

  const onVideoEnd = useCallback(() => {
    patch({ uiState: 'paused', isPlaying: false, currentTime: 0 });
  }, [patch]);

  // ---------------------------------------------------------------------------
  // Playback controls
  // ---------------------------------------------------------------------------

  const play = useCallback(() => {
    patch({ isPlaying: true, uiState: 'playing' });
    showControlsFor(3000);
    if (currentUri.current) syncTrackPlayer(currentUri.current, true).catch(() => {});
  }, [patch, showControlsFor]);

  const pause = useCallback(() => {
    patch({ isPlaying: false, uiState: 'paused' });
    showControlsFor(0);
    syncTrackPlayer(currentUri.current ?? '', false).catch(() => {});
  }, [patch, showControlsFor]);

  const seek = useCallback(
    (seconds: number) => {
      patch({ currentTime: seconds });
      showControlsFor(3000);
    },
    [patch, showControlsFor],
  );

  const setVolume = useCallback(
    (v: number) => patch({ volume: Math.max(0, Math.min(1, v)) }),
    [patch],
  );

  const toggleFullscreen = useCallback(async () => {
    const next = !state.isFullscreen;
    if (next) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      await ScreenOrientation.unlockAsync();
    }
    patch({ isFullscreen: next });
    showControlsFor(3000);
  }, [state.isFullscreen, patch, showControlsFor]);

  const togglePiP = useCallback(() => {
    patch({ isPiP: !state.isPiP });
  }, [state.isPiP, patch]);

  const retry = useCallback(() => {
    if (!currentUri.current) return;
    patch({ uiState: 'loading', isPlaying: true, errorMessage: null });
  }, [patch]);

  const selectQuality = useCallback(
    (index: number) => patch({ selectedQualityIndex: index }),
    [patch],
  );

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearHideTimer();
      ScreenOrientation.unlockAsync().catch(() => {});
      stopTrackPlayer();
    };
  }, [clearHideTimer]);

  useEffect(() => {
    currentUri.current = initialUri;
    patch(initialUri ? { uiState: 'loading', errorMessage: null, currentTime: 0 } : { uiState: 'offline' });
  }, [initialUri, patch]);

  return {
    ...state,
    videoRef,
    play,
    pause,
    seek,
    setVolume,
    toggleFullscreen,
    togglePiP,
    retry,
    selectQuality,
    showControlsFor,
    onVideoBuffer,
    onVideoError,
    onVideoProgress,
    onVideoLoad,
    onVideoEnd,
  };
}
