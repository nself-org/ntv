/**
 * Purpose: TV player state machine for nTV Apple TV / Android TV.
 * Inputs: streamUrl — HLS/DASH stream URI; optional initialTitle — current program title.
 * Outputs: TVPlayerState + controls consumed by TVPlayerControls and PlayerScreen.
 * Constraints: TV-only — no touch/swipe logic. All cleanup on unmount (timeouts + TVEventHandler).
 *              react-native-video handles both tvOS and Android TV via same API.
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS player feature status (T-P3-E4-W2-S5-T02)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoRef } from 'react-native-video';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TVPlayerUIState =
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'error';

export type TVPlayerState = {
  uiState: TVPlayerUIState;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  controlsVisible: boolean;
  errorMessage: string | null;
  streamUrl: string;
};

export type TVPlayerControls = {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  showControls: () => void;
  hideControls: () => void;
  retry: () => void;
  onVideoLoad: (data: { duration: number }) => void;
  onVideoBuffer: (meta: { isBuffering: boolean }) => void;
  onVideoProgress: (data: {
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
  }) => void;
  /**
   * react-native-video v6 OnVideoErrorData shape.
   * error.code is Int32 (number) on iOS/web; error.localizedDescription is iOS-only.
   */
  onVideoError: (data: {
    error: {
      errorString?: string;
      errorCode?: string;
      code?: number;
      localizedDescription?: string;
      error?: string;
    };
    cause?: object;
    target?: number;
  }) => void;
  onVideoEnd: () => void;
};

export type UseTVPlayerReturn = TVPlayerState &
  TVPlayerControls & {
    videoRef: React.RefObject<VideoRef | null>;
  };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTROLS_AUTO_DISMISS_MS = 5000;
const SEEK_STEP_SECONDS = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages all playback state for the TV player screen.
 * Exposes showControls() which auto-dismisses after 5s (resets on each call).
 * seekRelative() used by D-pad left/right on seek bar.
 */
export function useTVPlayer(
  streamUrl: string,
): UseTVPlayerReturn {
  const videoRef = useRef<VideoRef>(null);

  const [uiState, setUiState] = useState<TVPlayerUIState>('loading');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // Auto-dismiss controls after CONTROLS_AUTO_DISMISS_MS
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_AUTO_DISMISS_MS);
  }, []);

  const hideControls = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setControlsVisible(false);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    if (uiState === 'paused') setUiState('playing');
  }, [uiState]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (uiState === 'playing' || uiState === 'buffering') setUiState('paused');
  }, [uiState]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) pause(); else play();
    showControls();
  }, [isPlaying, play, pause, showControls]);

  const seek = useCallback((seconds: number) => {
    videoRef.current?.seek(Math.max(0, seconds));
    setCurrentTime(Math.max(0, seconds));
  }, []);

  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      const target = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
      seek(target);
      showControls();
    },
    [currentTime, duration, seek, showControls],
  );

  const retry = useCallback(() => {
    setErrorMessage(null);
    setUiState('loading');
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  // react-native-video callbacks
  const onVideoLoad = useCallback(
    (data: { duration: number }) => {
      setDuration(data.duration);
      setUiState('playing');
      setIsPlaying(true);
    },
    [],
  );

  const onVideoBuffer = useCallback(
    (meta: { isBuffering: boolean }) => {
      if (meta.isBuffering) setUiState('buffering');
      else if (uiState === 'buffering') setUiState(isPlaying ? 'playing' : 'paused');
    },
    [uiState, isPlaying],
  );

  const onVideoProgress = useCallback(
    (data: {
      currentTime: number;
      playableDuration: number;
      seekableDuration: number;
    }) => {
      setCurrentTime(data.currentTime);
      setBuffered(data.playableDuration);
      if (uiState === 'loading') setUiState('playing');
    },
    [uiState],
  );

  const onVideoError = useCallback(
    (data: {
      error: {
        errorString?: string;
        errorCode?: string;
        code?: number;
        localizedDescription?: string;
        error?: string;
      };
    }) => {
      const msg =
        data.error.localizedDescription ??
        data.error.errorString ??
        data.error.error ??
        (data.error.code != null ? `Error ${data.error.code}` : 'Stream unavailable');
      setErrorMessage(msg);
      setUiState('error');
      setIsPlaying(false);
    },
    [],
  );

  const onVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setUiState('paused');
    seek(0);
  }, [seek]);

  return {
    videoRef,
    uiState,
    isPlaying,
    currentTime,
    duration,
    buffered,
    controlsVisible,
    errorMessage,
    streamUrl,
    play,
    pause,
    togglePlayPause,
    seek,
    seekRelative,
    showControls,
    hideControls,
    retry,
    onVideoLoad,
    onVideoBuffer,
    onVideoProgress,
    onVideoError,
    onVideoEnd,
  };
}

export { SEEK_STEP_SECONDS };
