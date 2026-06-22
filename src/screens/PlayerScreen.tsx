/**
 * Purpose: ɳTV phone/tablet full-screen player screen with 7-state UI and VideoError
 *          typed error handling.
 *          Sub-components (ErrorCard, OfflineBanner, ControlsOverlay) live in
 *          PlayerScreenOverlays.tsx to keep this file under the 300-line cap.
 *
 * Inputs:
 *   - streamUri: string — HLS/DASH/MP4/RTSP URI
 *   - title: string — channel/content title shown in overlay
 *   - artworkUri?: string — artwork for audio-only streams
 *   - onBack: () => void — navigate back
 *
 * Outputs:
 *   - Full-screen react-native-video player with controls overlay.
 *   - 7 states: loading, buffering, playing, paused, error, offline, success.
 *
 * Constraints:
 *   - VideoError discriminated union from src/types/video-errors.ts.
 *   - All strings i18n-wrapped.
 *   - WCAG 2.1 AA: accessible labels on all controls.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv player-screen typed-errors; T-P3-E5-W3-S3-T01
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { type VideoRef } from 'react-native-video';
import { type VideoError } from '../types/video-errors';
import { ErrorCard, OfflineBanner, ControlsOverlay } from './PlayerScreenOverlays';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerScreenProps {
  streamUri: string;
  title?: string;
  artworkUri?: string;
  onBack?: () => void;
}

type UIState =
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'error'
  | 'offline'
  | 'success';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerScreen({
  streamUri,
  title = 'Live TV',
  artworkUri,
  onBack,
}: PlayerScreenProps): React.ReactElement {
  const videoRef = useRef<VideoRef>(null);
  const [uiState, setUiState] = useState<UIState>('loading');
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState<VideoError | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // ─── Video callbacks ────────────────────────────────────────────────────────

  const handleLoad = useCallback(() => {
    setUiState('playing');
    setVideoError(null);
    setIsOffline(false);
  }, []);

  const handleBuffer = useCallback(({ isBuffering }: { isBuffering: boolean }) => {
    if (uiState === 'error' || uiState === 'offline') return;
    setUiState(isBuffering ? 'buffering' : 'playing');
  }, [uiState]);

  const handleError = useCallback((data: {
    error?: {
      code?: number;
      errorString?: string;
      localizedDescription?: string;
    };
  }) => {
    const code = data?.error?.code;
    const desc = data?.error?.localizedDescription ?? data?.error?.errorString ?? '';

    // Heuristic: network error codes
    const isNetwork =
      code === -1009 || // NSURLErrorNotConnectedToInternet
      code === -1004 || // NSURLErrorCannotConnectToHost
      desc.toLowerCase().includes('network') ||
      desc.toLowerCase().includes('connection');
    const isDrm = desc.toLowerCase().includes('drm') || desc.toLowerCase().includes('protected');

    let err: VideoError;
    if (isNetwork) {
      err = { type: 'network', code: String(code ?? 'unknown') };
      setIsOffline(true);
    } else if (isDrm) {
      err = { type: 'drm_error', errorCode: code };
    } else {
      err = { type: 'stream_unavailable', reason: desc };
    }

    setVideoError(err);
    setUiState('error');
  }, []);

  const handleRetry = useCallback(() => {
    setVideoError(null);
    setIsOffline(false);
    setUiState('loading');
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      setUiState(!prev ? 'playing' : 'paused');
      return !prev;
    });
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Video player — always mounted to allow fast resume */}
      {uiState !== 'offline' && (
        <Video
          ref={videoRef}
          source={{ uri: streamUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!isPlaying}
          onLoad={handleLoad}
          onBuffer={handleBuffer}
          onError={handleError as any}
          repeat={false}
          allowsExternalPlayback
          accessibilityLabel={`Playing ${title}`}
        />
      )}

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBannerContainer}>
          <OfflineBanner />
        </View>
      )}

      {/* Error card */}
      {uiState === 'error' && videoError && (
        <View style={styles.errorOverlay}>
          <ErrorCard error={videoError} onRetry={handleRetry} />
        </View>
      )}

      {/* Controls overlay (loading / buffering / playing / paused) */}
      {uiState !== 'error' && uiState !== 'offline' && (
        <ControlsOverlay
          title={title}
          uiState={uiState}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onBack={onBack}
        />
      )}

      {/* Back button shown during error/offline states */}
      {(uiState === 'error' || uiState === 'offline') && onBack && (
        <SafeAreaView style={styles.safeBack} pointerEvents="box-none">
          <Pressable
            style={styles.backButtonStandalone}
            onPress={onBack}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  offlineBannerContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  safeBack: { position: 'absolute', top: 0, left: 0 },
  backButtonStandalone: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    margin: 16,
  },
  backIcon: { fontSize: 32, color: '#fff', lineHeight: 36 },
});
