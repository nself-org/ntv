/**
 * Purpose: Accessible error overlay card for the ɳTV TV player — displays a typed
 *          VideoError with Retry and Back D-pad-focusable buttons.
 *
 * Inputs:
 *   error    — VideoError discriminated union from src/types/video-errors.ts.
 *   onRetry? — if provided (and error is retryable), shows a Retry button.
 *   onBack?  — if provided, shows a Back button.
 *
 * Outputs: Styled alert container with icon, message text, and TV-focusable buttons.
 *
 * Constraints:
 *   - isTVSelectable on all Pressable elements.
 *   - hasTVPreferredFocus: Retry first (if retryable), else Back.
 *   - Text >= 24pt for TV readability (WCAG Large Text rule on TV).
 *   - No touch gestures — D-pad only.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-error-card
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TVFocusGuideView } from './tv-compat';
import {
  type VideoError,
  getVideoErrorMessage,
  isRetryableError,
} from '../types/video-errors';
import { TV_COLORS as C } from './TVPlayerColors';

export interface TVErrorCardProps {
  error: VideoError;
  onRetry?: () => void;
  onBack?: () => void;
}

/** Full-screen-overlay error card for TV players. D-pad focusable; no touch required. */
export function TVErrorCard({ error, onRetry, onBack }: TVErrorCardProps): React.ReactElement {
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

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 12 },
  errorMessage: { fontSize: 24, color: C.muted, textAlign: 'center', lineHeight: 34 },
  errorButtons: { flexDirection: 'row', gap: 20, marginTop: 32 },
  tvButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tvButtonFocused: {
    borderColor: C.focusBorder,
    backgroundColor: C.focusBg,
  },
  tvButtonText: { fontSize: 26, color: C.text, fontWeight: '600' },
  tvButtonTextFocused: { color: C.focusBorder },
});
