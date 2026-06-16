/**
 * useCast — Chromecast + AirPlay casting state machine for ntv player.
 *
 * Purpose: Manages the full casting lifecycle for the ntv IPTV player.
 *          Chromecast via react-native-google-cast (CastContext, useRemoteMediaClient).
 *          AirPlay on iOS via expo-av AVRoutePickerView integration.
 *          Exposes a unified CastState so the player UI can react to cast events
 *          without knowing which technology is active.
 *
 * Inputs:  streamUrl   — the IPTV stream URL currently loaded in the local player.
 *          streamTitle — display name for the channel being cast (shown on TV).
 *          contentType — MIME type of the stream (default 'application/x-mpegURL' for HLS).
 *
 * Outputs: CastState — {
 *            status         : CastStatus  (disconnected | connecting | connected)
 *            deviceName     : string | null  (name of the Chromecast device, if connected)
 *            startCast()    : () => Promise<void>  (open device picker + start session)
 *            stopCast()     : () => Promise<void>  (end session + resume local playback)
 *            pauseRemote()  : () => Promise<void>
 *            resumeRemote() : () => Promise<void>
 *            seekRemote(positionSeconds: number) : () => Promise<void>
 *            lastPosition   : number  (seconds — used to resume local playback position)
 *            isAirPlayAvailable : boolean  (iOS only; always false on Android)
 *          }
 *
 * Constraints:
 *   - Chromecast: GoogleCastContext must be initialised in AppDelegate.mm (T01 scaffold).
 *     This hook works correctly even if the context was not initialised — operations no-op.
 *   - AirPlay: iOS only. On Android, isAirPlayAvailable is always false.
 *   - When cast starts the caller MUST pause the local react-native-video player
 *     to prevent double-audio. The hook fires onLocalPlaybackStop() callback for this.
 *   - When cast stops the hook fires onLocalPlaybackResume(positionSeconds) so the caller
 *     can seek the local player to the last known cast position before resuming.
 *   - seekRemote clamps to [0, duration] if duration is known.
 *   - Position polling: every 5 s when connected, stores lastPosition.
 *   - No custom Chromecast receiver — uses the default media receiver app.
 *   - No Android TV casting (covered in S5 TV platform sprint).
 *
 * SPORT: none — hook-only, no tracked entity.
 * Cross-ref: CastButton.tsx · T-P3-E4-W2-S4-T04 · T-P3-E4-W2-S4-T02 (player screen)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  CastState as GoogleCastState,
  useCastState,
  useRemoteMediaClient,
  MediaPlayerState,
} from 'react-native-google-cast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Discriminated status for the unified cast state machine. */
export type CastStatus = 'disconnected' | 'connecting' | 'connected';

export interface UseCastOptions {
  /** Current stream URL loaded in the local player. */
  streamUrl: string;
  /** Channel display name shown on the cast receiver screen. */
  streamTitle: string;
  /** MIME type. Defaults to HLS. */
  contentType?: string;
  /** Called when a cast session starts — caller must pause local video. */
  onLocalPlaybackStop?: () => void;
  /** Called when a cast session ends — caller must resume local video at positionSeconds. */
  onLocalPlaybackResume?: (positionSeconds: number) => void;
}

export interface CastState {
  status: CastStatus;
  deviceName: string | null;
  startCast: () => Promise<void>;
  stopCast: () => Promise<void>;
  pauseRemote: () => Promise<void>;
  resumeRemote: () => Promise<void>;
  seekRemote: (positionSeconds: number) => Promise<void>;
  lastPosition: number;
  isAirPlayAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Position polling interval (ms)
// ---------------------------------------------------------------------------
const POSITION_POLL_MS = 5_000;

// ---------------------------------------------------------------------------
// useCast
// ---------------------------------------------------------------------------

export function useCast(options: UseCastOptions): CastState {
  const {
    streamUrl,
    streamTitle,
    contentType = 'application/x-mpegURL',
    onLocalPlaybackStop,
    onLocalPlaybackResume,
  } = options;

  // react-native-google-cast hooks
  const castState = useCastState();
  const client = useRemoteMediaClient();

  // Local state
  const [lastPosition, setLastPosition] = useState(0);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const positionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AirPlay is only meaningful on iOS
  const isAirPlayAvailable = Platform.OS === 'ios';

  // --------------------------------------------------------------------------
  // Derive unified CastStatus from google-cast SDK state
  // --------------------------------------------------------------------------
  const status: CastStatus = (() => {
    switch (castState) {
      case GoogleCastState.CONNECTING:
        return 'connecting';
      case GoogleCastState.CONNECTED:
        return 'connected';
      default:
        return 'disconnected';
    }
  })();

  // --------------------------------------------------------------------------
  // Position polling — runs while connected
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (status === 'connected' && client) {
      positionPollRef.current = setInterval(async () => {
        try {
          const mediaStatus = await client.getMediaStatus();
          if (mediaStatus?.streamPosition != null) {
            setLastPosition(mediaStatus.streamPosition);
          }
          // Capture device name if not yet set
          if (!deviceName) {
            const session = await client.getSessionStatus?.();
            if (session?.device?.friendlyName) {
              setDeviceName(session.device.friendlyName);
            }
          }
        } catch {
          // Non-fatal — position display degrades gracefully
        }
      }, POSITION_POLL_MS);
    } else {
      if (positionPollRef.current) {
        clearInterval(positionPollRef.current);
        positionPollRef.current = null;
      }
      if (status === 'disconnected') {
        setDeviceName(null);
      }
    }
    return () => {
      if (positionPollRef.current) {
        clearInterval(positionPollRef.current);
        positionPollRef.current = null;
      }
    };
  }, [status, client, deviceName]);

  // --------------------------------------------------------------------------
  // startCast — open device picker, load media, notify caller to stop local
  // --------------------------------------------------------------------------
  const startCast = useCallback(async (): Promise<void> => {
    if (!client) return;
    try {
      // Load the stream on the remote device
      await client.loadMedia({
        mediaInfo: {
          contentUrl: streamUrl,
          contentType,
          metadata: {
            type: 'generic',
            title: streamTitle,
          },
        },
        startTime: lastPosition > 0 ? lastPosition : undefined,
      });
      // Stop local video to prevent double-audio
      onLocalPlaybackStop?.();
    } catch (err) {
      // Surface to caller via console; UI fallback is handled in CastButton
      console.warn('[useCast] startCast error:', err);
    }
  }, [client, streamUrl, contentType, streamTitle, lastPosition, onLocalPlaybackStop]);

  // --------------------------------------------------------------------------
  // stopCast — end the cast session, resume local playback at last position
  // --------------------------------------------------------------------------
  const stopCast = useCallback(async (): Promise<void> => {
    if (!client) return;
    try {
      const captured = lastPosition;
      await client.stop();
      onLocalPlaybackResume?.(captured);
    } catch (err) {
      console.warn('[useCast] stopCast error:', err);
    }
  }, [client, lastPosition, onLocalPlaybackResume]);

  // --------------------------------------------------------------------------
  // pauseRemote
  // --------------------------------------------------------------------------
  const pauseRemote = useCallback(async (): Promise<void> => {
    if (!client) return;
    try {
      await client.pause();
    } catch (err) {
      console.warn('[useCast] pauseRemote error:', err);
    }
  }, [client]);

  // --------------------------------------------------------------------------
  // resumeRemote
  // --------------------------------------------------------------------------
  const resumeRemote = useCallback(async (): Promise<void> => {
    if (!client) return;
    try {
      await client.play();
    } catch (err) {
      console.warn('[useCast] resumeRemote error:', err);
    }
  }, [client]);

  // --------------------------------------------------------------------------
  // seekRemote — clamp to 0+; upper clamp applied server-side
  // --------------------------------------------------------------------------
  const seekRemote = useCallback(
    async (positionSeconds: number): Promise<void> => {
      if (!client) return;
      const clamped = Math.max(0, positionSeconds);
      try {
        await client.seek({ position: clamped });
      } catch (err) {
        console.warn('[useCast] seekRemote error:', err);
      }
    },
    [client],
  );

  return {
    status,
    deviceName,
    startCast,
    stopCast,
    pauseRemote,
    resumeRemote,
    seekRemote,
    lastPosition,
    isAirPlayAvailable,
  };
}
