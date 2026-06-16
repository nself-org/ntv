/**
 * CastButton — Chromecast + AirPlay casting control for the ntv player screen.
 *
 * Purpose: Renders the correct cast affordance based on platform and cast availability.
 *          On both iOS and Android: shows the react-native-google-cast CastButton
 *          which auto-hides when no Chromecast device is reachable on the local network.
 *          On iOS additionally: shows the AVRoutePickerView (AirPlay) button from expo-av
 *          so the user can route audio/video via AirPlay without tapping the Chromecast button.
 *          Displays current cast status (connecting / casting-to-DeviceName) inline.
 *
 * Inputs:  streamUrl    — passed to useCast for remote media loading.
 *          streamTitle  — channel name shown on the cast receiver screen.
 *          contentType? — MIME type (default HLS).
 *          onLocalPlaybackStop?   — called when cast session begins; caller must pause local video.
 *          onLocalPlaybackResume? — called with position when cast ends; caller seeks + resumes local video.
 *          style?       — optional ViewStyle applied to the outer container.
 *
 * Outputs: A row containing:
 *          - react-native-google-cast <CastButton /> (auto-shows when device available)
 *          - [iOS only] expo-av <AudioVideoRoutePicker /> (AirPlay picker)
 *          - Cast status label: "Casting to <DeviceName>" | "Connecting…" | nothing when idle
 *
 * Constraints:
 *   - The Google CastButton component auto-hides itself when no Chromecast is on the network.
 *     We do not conditionally render it — it manages its own visibility.
 *   - AirPlay picker is rendered only on iOS (Platform.OS === 'ios').
 *   - Tapping the CastButton while disconnected opens the OS-native device picker.
 *     After the user selects a device, startCast() loads the media.
 *   - Status label is hidden when status === 'disconnected'.
 *   - WCAG 2.1 AA: CastButton has accessibilityLabel; status label has accessibilityLiveRegion.
 *   - No double-audio: caller MUST pause local react-native-video on onLocalPlaybackStop.
 *   - Custom Chromecast receiver app is out of scope — uses default media receiver.
 *
 * SPORT: none — component-only, no tracked entity.
 * Cross-ref: useCast.ts · T-P3-E4-W2-S4-T04 · T-P3-E4-W2-S4-T02 (player screen integration)
 */

import React from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { CastButton as GoogleCastButton } from 'react-native-google-cast';
import { useCast, type CastStatus, type UseCastOptions } from '../hooks/useCast';

// ---------------------------------------------------------------------------
// AirPlay picker — iOS only, guarded by Platform.OS check at render time.
// AudioVideoRoutePicker is exported from expo-av on iOS; on Android the module
// still exists but the component is a no-op. We additionally gate on Platform.OS
// to keep the TS types simple and avoid any Android surface.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExpoAV = require('expo-av');
const AudioVideoRoutePicker: React.ComponentType<{ style?: ViewStyle }> | null =
  Platform.OS === 'ios' ? (ExpoAV.AudioVideoRoutePicker ?? null) : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CastButtonProps extends UseCastOptions {
  /** Optional outer container style. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Status label helpers
// ---------------------------------------------------------------------------

function statusLabel(status: CastStatus, deviceName: string | null): string | null {
  if (status === 'connecting') return 'Connecting…';
  if (status === 'connected' && deviceName) return `Casting to ${deviceName}`;
  if (status === 'connected') return 'Casting';
  return null;
}

// ---------------------------------------------------------------------------
// CastButton
// ---------------------------------------------------------------------------

export function CastButton({
  streamUrl,
  streamTitle,
  contentType,
  onLocalPlaybackStop,
  onLocalPlaybackResume,
  style,
}: CastButtonProps): React.ReactElement {
  const cast = useCast({
    streamUrl,
    streamTitle,
    contentType,
    onLocalPlaybackStop,
    onLocalPlaybackResume,
  });

  const label = statusLabel(cast.status, cast.deviceName);

  return (
    <View style={[styles.container, style]} accessibilityRole="toolbar">
      {/* Chromecast button — auto-shows/-hides based on network device availability.
          On tap when disconnected: opens native device picker. The useCast hook's
          startCast() is called automatically when a session is established via
          the CastContext session listener (set up in AppDelegate.mm). */}
      <GoogleCastButton
        style={styles.castBtn}
        accessibilityLabel="Cast to TV"
        accessibilityHint="Opens a device picker to cast this stream to a Chromecast device"
      />

      {/* AirPlay picker — iOS only */}
      {cast.isAirPlayAvailable && AudioVideoRoutePicker != null && (
        <AudioVideoRoutePicker
          style={styles.airplayBtn}
          // accessibilityLabel is set internally by AVRoutePickerView in UIKit
        />
      )}

      {/* Cast status label */}
      {label != null && (
        <Text
          style={styles.statusLabel}
          accessibilityLiveRegion="polite"
          accessibilityLabel={label}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  castBtn: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  },
  airplayBtn: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
});
