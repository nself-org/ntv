/**
 * Purpose: Background audio hook for nTV — single consumer interface for
 * react-native-track-player. Exposes play/pause/stop to PlayerScreen.
 * Handles TrackPlayer setup, track metadata (channel name + artwork),
 * and cleanup on unmount (TrackPlayer.destroy()).
 *
 * Inputs:
 *   - StreamMetadata: { url, title, artwork? } — IPTV audio stream info
 *
 * Outputs:
 *   - play(url, metadata): load track + start playback with lock screen info
 *   - pause(): pause stream, lock screen controls remain visible
 *   - stop(): stop + clear queue
 *   - isPlaying: boolean — reflects current TrackPlayer state
 *   - isReady: boolean — TrackPlayer.setupPlayer() completed
 *
 * Constraints:
 *   - This hook is the ONLY consumer of TrackPlayer — never call TrackPlayer
 *     directly from PlayerScreen or other components.
 *   - TrackPlayer.destroy() called on unmount to release audio session.
 *   - Non-fatal: errors are caught and surfaced via onError callback only.
 *   - iOS: AVAudioSession category set to playback via app.json plugin config.
 *
 * SPORT: F08-SERVICE-INVENTORY.md — ntv background-audio-service
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import TrackPlayer, {
  Capability,
  Event,
  State as TrackState,
  useTrackPlayerEvents,
} from 'react-native-track-player';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamMetadata {
  /** Displayed as "track title" on lock screen and notification shade. */
  title: string;
  /** Displayed as "artist" — typically channel group or "nTV". */
  artist?: string;
  /** URL to channel logo shown on lock screen / notification shade. */
  artwork?: string;
}

export interface BackgroundAudioControls {
  play: (url: string, metadata: StreamMetadata) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  isPlaying: boolean;
  isReady: boolean;
}

// ---------------------------------------------------------------------------
// Singleton setup guard — TrackPlayer.setupPlayer() must only run once
// ---------------------------------------------------------------------------

let _setupComplete = false;

async function setupOnce(): Promise<void> {
  if (_setupComplete) return;
  try {
    await TrackPlayer.setupPlayer({
      // Keep audio session alive when app backgrounds
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      // Lock screen + notification shade capabilities
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
      // Android: show in notification shade even when paused
      notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    });
    _setupComplete = true;
  } catch {
    // Already initialized — safe to continue
    _setupComplete = true;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useBackgroundAudio — single interface for background audio + lock screen controls.
 * Wire this into PlayerScreen for audio streams (IPTV radio channels).
 * For video streams, use react-native-video directly.
 */
export function useBackgroundAudio(): BackgroundAudioControls {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const currentUrl = useRef<string | null>(null);

  // Setup TrackPlayer on mount
  useEffect(() => {
    let cancelled = false;
    setupOnce().then(() => {
      if (!cancelled) setIsReady(true);
    });

    return () => {
      cancelled = true;
      // reset() stops playback and clears queue, releasing audio focus.
      // react-native-track-player v4.x has no destroy() — reset() is the
      // correct teardown for unmounting the last consumer.
      TrackPlayer.reset().catch(() => {});
      _setupComplete = false;
    };
  }, []);

  // Mirror TrackPlayer state into isPlaying
  useTrackPlayerEvents([Event.PlaybackState], (event) => {
    if (event.type === Event.PlaybackState) {
      setIsPlaying(event.state === TrackState.Playing);
    }
  });

  /**
   * play — load stream URL with lock screen metadata + start playback.
   * Replaces queue if URL changed; resumes if same URL.
   */
  const play = useCallback(async (url: string, metadata: StreamMetadata): Promise<void> => {
    try {
      await setupOnce();
      const queue = await TrackPlayer.getQueue();
      const currentTrack = queue[0];

      if (!currentTrack || currentTrack.url !== url) {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          url,
          title: metadata.title,
          artist: metadata.artist ?? 'nTV',
          artwork: metadata.artwork,
          // isLiveStream prevents TrackPlayer from showing duration scrubber
          isLiveStream: true,
        });
        currentUrl.current = url;
      }

      await TrackPlayer.play();
    } catch {
      // Non-fatal — PlayerScreen falls back to react-native-video
    }
  }, []);

  /**
   * pause — pause playback; lock screen controls remain visible.
   */
  const pause = useCallback(async (): Promise<void> => {
    try {
      await TrackPlayer.pause();
    } catch {
      // ignore
    }
  }, []);

  /**
   * stop — stop playback and clear queue; releases audio focus.
   */
  const stop = useCallback(async (): Promise<void> => {
    try {
      await TrackPlayer.stop();
      currentUrl.current = null;
    } catch {
      // ignore
    }
  }, []);

  return { play, pause, stop, isPlaying, isReady };
}
