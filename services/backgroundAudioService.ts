/**
 * Purpose: Background audio PlaybackService for react-native-track-player.
 * Registers as the native background audio service (iOS Now Playing +
 * Android media session). Handles remote control events from lock screen
 * and notification shade. Must be registered via TrackPlayer.registerPlaybackService()
 * at app entry (expo-router/entry via index.js shim or _layout.tsx).
 *
 * Inputs:
 *   - Remote events from native media session (play/pause/stop)
 *
 * Outputs:
 *   - Drives TrackPlayer in response to lock screen / notification controls
 *
 * Constraints:
 *   - Runs in a separate JS context on Android (background service)
 *   - Must not import React or any UI modules
 *   - Must be registered once before TrackPlayer.setupPlayer()
 *
 * SPORT: F08-SERVICE-INVENTORY.md — ntv background-audio-service
 */

import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * PlaybackService — registered with TrackPlayer.registerPlaybackService().
 * Handles remote events emitted by iOS Now Playing / Android media session.
 */
export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  // Duck audio on interruption (call, alarm, notification) — resume after
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ paused, permanent }) => {
    if (permanent) {
      await TrackPlayer.stop();
    } else if (paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
}
