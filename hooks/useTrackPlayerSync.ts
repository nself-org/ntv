/**
 * Purpose: Singleton TrackPlayer setup + background audio sync for nTV.
 * Handles idempotent player setup, queue management, and play/pause sync.
 * Extracted from useMediaPlayer to keep files under 300 lines.
 *
 * Inputs:
 *   - uri: string — stream URL
 *   - playing: boolean — desired play state
 *
 * Outputs:
 *   - ensureTrackPlayer(): Promise<void> — idempotent setup
 *   - syncTrackPlayer(uri, playing): Promise<void> — sync queue + play state
 *
 * Constraints:
 *   - Non-fatal: all errors swallowed (video player is primary)
 *   - Idempotent: safe to call multiple times
 */

import TrackPlayer, {
  Capability,
  State as TrackState,
} from 'react-native-track-player';

let trackPlayerSetup = false;

export async function ensureTrackPlayer(): Promise<void> {
  if (trackPlayerSetup) return;
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });
    trackPlayerSetup = true;
  } catch {
    // Already setup or unsupported platform — ignore
  }
}

export async function syncTrackPlayer(
  uri: string,
  playing: boolean,
): Promise<void> {
  try {
    await ensureTrackPlayer();
    const queue = await TrackPlayer.getQueue();
    const current = queue[0];
    if (!current || current.url !== uri) {
      await TrackPlayer.reset();
      await TrackPlayer.add({ url: uri, title: 'nTV Stream', artist: 'nTV' });
    }
    if (playing) {
      await TrackPlayer.play();
    } else {
      await TrackPlayer.pause();
    }
  } catch {
    // Non-fatal — video player handles primary playback
  }
}

export async function pauseTrackPlayerIfPlaying(): Promise<void> {
  try {
    const state = await TrackPlayer.getState();
    if (state === TrackState.Playing) {
      await TrackPlayer.pause();
    }
  } catch {
    // ignore
  }
}

export async function stopTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.stop();
  } catch {
    // ignore
  }
}
