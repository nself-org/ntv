# nTV Background Audio & Lock Screen Controls

nTV supports background audio playback for IPTV audio streams (radio channels). When an audio-only stream is playing, the audio continues after the screen locks or the user switches to another app. Native lock screen controls and the Android notification shade display the channel name, artwork, and play/pause/stop buttons.

## How It Works

| Layer | File | Role |
|---|---|---|
| PlaybackService | `services/backgroundAudioService.ts` | Handles remote events (play/pause/stop) from lock screen / notification |
| Hook | `hooks/useBackgroundAudio.ts` | Single consumer interface — wraps TrackPlayer, manages setup and cleanup |
| Player screen | `src/app/player/[id].tsx` | Detects audio-only streams; routes to `useBackgroundAudio` |
| Config | `app.json` | `UIBackgroundModes: [audio]` (iOS) + `react-native-track-player` plugin |

## Architecture Rule

`useBackgroundAudio` is the **only** consumer of `react-native-track-player` in this app. Never import `TrackPlayer` directly in screens or other hooks — always use this hook.

## Audio vs Video Streams

The player screen detects audio-only streams by URL extension or path:

- Audio: `.aac`, `.mp3`, `.ogg`, `.m4a`, paths containing `/radio/` or `/audio/`
- Everything else: `react-native-video` (T02)

For audio streams:
1. `useBackgroundAudio.play(url, metadata)` loads the track with channel name + artwork
2. TrackPlayer sends metadata to iOS Now Playing / Android media session
3. `react-native-video` is not rendered (hidden)

## Lock Screen Behavior

| Platform | Control surface | Capabilities |
|---|---|---|
| iOS | Now Playing widget (lock screen + Control Center) | Play / Pause / Stop |
| Android | Media notification (notification shade) | Play / Pause / Stop |

Both surfaces update automatically when `useBackgroundAudio.play()` is called with metadata.

## iOS Configuration

`UIBackgroundModes: ["audio", "fetch"]` is set in `app.json` under `expo.ios.infoPlist`. This entitlement is required for audio to continue after the screen locks. EAS Build applies it automatically during prebuild.

## Android Configuration

The `react-native-track-player` plugin in `app.json` configures the foreground service and media session automatically. No additional `AndroidManifest.xml` changes are needed.

## PlaybackService Registration

`PlaybackService` must be registered **once** before `TrackPlayer.setupPlayer()` is called. For Expo managed workflow, register it in `_layout.tsx` (root layout) or an app entry shim:

```ts
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from '../services/backgroundAudioService';

TrackPlayer.registerPlaybackService(() => PlaybackService);
```

`useBackgroundAudio` calls `setupPlayer()` idempotently — safe to call from multiple hook instances.

## API

### `useBackgroundAudio()`

Returns `BackgroundAudioControls`:

| Field | Type | Description |
|---|---|---|
| `play(url, metadata)` | `(string, StreamMetadata) => Promise<void>` | Load track + start playback |
| `pause()` | `() => Promise<void>` | Pause; lock screen controls remain visible |
| `stop()` | `() => Promise<void>` | Stop + clear queue; releases audio focus |
| `isPlaying` | `boolean` | True when TrackPlayer is in Playing state |
| `isReady` | `boolean` | True after `setupPlayer()` resolves |

### `StreamMetadata`

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Channel name — shown on lock screen |
| `artist` | `string?` | Channel group or "nTV" |
| `artwork` | `string?` | Channel logo URL |

## Tests

```sh
pnpm --dir ntv test hooks/useBackgroundAudio
```

Test file: `hooks/__tests__/useBackgroundAudio.test.ts`

Covers: mount/unmount lifecycle, play with new URL, play reuses existing track, queue reset on URL change, pause, stop, destroy on unmount.
