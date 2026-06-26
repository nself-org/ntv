/**
 * Purpose: Loading, error, and offline state overlays for the ɳTV media player.
 *          Extracted from PlayerControls.tsx to keep that file under the 300-line cap.
 *
 * Inputs:
 *   BufferingOverlay — no props (always shown when buffering/loading).
 *   ErrorOverlay     — errorTitle, errorMessage, onRetry.
 *   OfflineOverlay   — onRetry.
 *
 * Outputs: Absolutely-positioned overlay Views for each player state.
 *
 * Constraints:
 *   - All strings must be i18n-wrapped in the parent (passed as props).
 *   - Accessibility labels on all interactive elements.
 *   - No media logic — pure presentation.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv player-state-overlays
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Buffering overlay ────────────────────────────────────────────────────────

/** Shown during 'loading' and 'buffering' states. */
export function BufferingOverlay(): React.ReactElement {
  return (
    <View style={styles.bufferingOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

// ─── Error overlay ────────────────────────────────────────────────────────────

export interface ErrorOverlayProps {
  errorTitle: string;
  errorMessage: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Shown during 'error' state — title, message, and Retry button. */
export function ErrorOverlay({
  errorTitle,
  errorMessage,
  retryLabel,
  onRetry,
}: ErrorOverlayProps): React.ReactElement {
  return (
    <View style={styles.errorOverlay}>
      <Text style={styles.errorTitle} accessibilityLabel={errorTitle}>{errorTitle}</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.retryText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Offline overlay ──────────────────────────────────────────────────────────

export interface OfflineOverlayProps {
  noConnectionLabel: string;
  checkInternetLabel: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Shown during 'offline' state — no connection message and Retry button. */
export function OfflineOverlay({
  noConnectionLabel,
  checkInternetLabel,
  retryLabel,
  onRetry,
}: OfflineOverlayProps): React.ReactElement {
  return (
    <View style={styles.errorOverlay}>
      <Text style={styles.errorTitle} accessibilityLabel={noConnectionLabel}>{noConnectionLabel}</Text>
      <Text style={styles.errorMessage}>{checkInternetLabel}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.retryText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
