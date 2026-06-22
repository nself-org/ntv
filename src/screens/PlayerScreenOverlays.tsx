/**
 * Purpose: Error card, offline banner, and controls overlay for the ɳTV phone/tablet player.
 *          Extracted from PlayerScreen.tsx to keep that file under the 300-line cap.
 *
 * Inputs:
 *   ErrorCard       — error: VideoError, onRetry?: () => void.
 *   OfflineBanner   — no props.
 *   ControlsOverlay — title, uiState, isPlaying, onTogglePlay, onBack?.
 *
 * Outputs: Styled overlay components — no media state logic.
 *
 * Constraints:
 *   - VideoError typed errors from src/types/video-errors.ts.
 *   - Accessibility labels on all interactive elements (WCAG 2.1 AA).
 *   - No touch gesture hooks — all callbacks passed as props.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv player-screen-overlays
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  type VideoError,
  getVideoErrorMessage,
  isRetryableError,
} from '../types/video-errors';

// ─── Error card ───────────────────────────────────────────────────────────────

export interface ErrorCardProps {
  error: VideoError;
  onRetry?: () => void;
}

/** Card with error icon, message text, and conditional Retry button. */
export function ErrorCard({ error, onRetry }: ErrorCardProps): React.ReactElement {
  const message = getVideoErrorMessage(error);
  const canRetry = isRetryableError(error);

  return (
    <View
      style={styles.errorCard}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Playback error: ${message}`}
    >
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Playback Error</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {canRetry && onRetry && (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Retry playback"
          hitSlop={8}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────

/** Top-of-screen alert shown when playback fails due to loss of connectivity. */
export function OfflineBanner(): React.ReactElement {
  return (
    <View
      style={styles.offlineBanner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="No internet connection — playback unavailable"
    >
      <Text style={styles.offlineBannerText}>
        No internet connection — live streaming requires an active connection.
      </Text>
    </View>
  );
}

// ─── Controls overlay ─────────────────────────────────────────────────────────

type UIState = 'loading' | 'buffering' | 'playing' | 'paused' | 'error' | 'offline' | 'success';

export interface ControlsOverlayProps {
  title: string;
  uiState: UIState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onBack?: () => void;
}

/** Title bar + center play/pause/spinner controls. Shown during non-error states. */
export function ControlsOverlay({
  title,
  uiState,
  isPlaying,
  onTogglePlay,
  onBack,
}: ControlsOverlayProps): React.ReactElement {
  return (
    <View style={styles.controlsOverlay} pointerEvents="box-none">
      <View style={styles.controlsTop}>
        {onBack && (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        )}
        <Text style={styles.controlsTitle} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.controlsCenter} pointerEvents="box-none">
        {(uiState === 'loading' || uiState === 'buffering') && (
          <ActivityIndicator
            size="large"
            color="#fff"
            accessible
            accessibilityLabel={uiState === 'buffering' ? 'Buffering' : 'Loading'}
          />
        )}
        {(uiState === 'playing' || uiState === 'paused') && (
          <Pressable
            style={styles.playPauseButton}
            onPress={onTogglePlay}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            hitSlop={12}
          >
            <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  controlsTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  controlsCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 32, color: '#fff', lineHeight: 36 },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: { fontSize: 30, color: '#fff' },
  errorCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb', marginBottom: 8 },
  errorMessage: { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { fontSize: 13, fontWeight: '600', color: '#000', textAlign: 'center' },
});
