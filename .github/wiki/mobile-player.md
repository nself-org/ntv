# nTV Mobile Player

> **Stack:** React Native + Expo (P3 migration from Flutter)
> **Status:** WIP — react-native-video implementation (T02 complete); full migration complete at T09.

## Overview

The nTV media player uses `react-native-video` for HLS, DASH, MP4, and RTSP stream playback.
Background audio is handled by `react-native-track-player`. Picture-in-picture uses the
native iOS/Android PiP APIs exposed via react-native-video props.

## Architecture

```
ntv/app/(tabs)/player.tsx        — Screen: Video element + PlayerControls overlay
ntv/components/PlayerControls.tsx — Controls overlay (play/pause/seek/volume/fullscreen/quality/PiP)
ntv/hooks/useMediaPlayer.ts       — State machine: all media logic, TrackPlayer sync, orientation
```

## Supported Formats

| Format | Notes |
|--------|-------|
| HLS (.m3u8) | Primary — quality variant switching supported |
| DASH | Via react-native-video ExoPlayer (Android) / AVPlayer (iOS) |
| MP4 | Direct |
| RTSP | Live camera / IPTV streams |

## UI States (all 7)

| State | Description |
|-------|-------------|
| `loading` | Stream URI set, waiting for first frame |
| `buffering` | Video paused due to network buffer |
| `playing` | Active playback |
| `paused` | User paused |
| `error` | Stream unavailable / codec / network error — retry button shown |
| `offline` | No stream URI set |
| `success` | Video loaded, metadata available |

## Features

### Custom Controls Overlay
- Auto-hides after 3 seconds of inactivity during playback
- Remains visible while paused
- Tap overlay to reset hide timer

### Picture-in-Picture
- **iOS:** `pictureInPicture` prop on `<Video>` — requires `com.apple.developer.avfoundation.multitasking-camera-access` entitlement in `ios/ntv/ntv.entitlements`
- **Android:** `pictureInPicture` prop + AppState background trigger

### Background Audio
- `react-native-track-player` takes over when app backgrounds
- Resumes when foregrounded (TrackPlayer paused, Video resumes)
- iOS: `ignoreSilentSwitch="ignore"` + `playWhenInactive={true}`
- Android: `playInBackground={true}` + TrackPlayer handoff

### HLS Quality Selection
- `selectedVideoTrack` prop on `<Video>`: `{ type: 'auto' }` or `{ type: 'index', value: N }`
- Quality picker sheet shows available HLS variant stream labels
- Variants populated via `onLoad` → track data

### Fullscreen
- `expo-screen-orientation` locks to `LANDSCAPE` on fullscreen
- Restored to unlocked on fullscreen exit or screen unmount

## Dependencies

```
react-native-video           — Video playback (HLS/DASH/MP4/RTSP)
react-native-track-player   — Background audio
expo-screen-orientation     — Fullscreen landscape lock
@react-native-community/slider — Seek + volume sliders
expo-router                 — Navigation (searchParam: uri)
```

## Native Setup Required

### iOS
- `ios/ntv/ntv.entitlements`: add `com.apple.developer.avfoundation.multitasking-camera-access` for PiP.
- `AppDelegate.swift`: set `AVAudioSession.sharedInstance().setCategory(.playback)` for background audio.

### Android
- `android/app/src/main/AndroidManifest.xml`: `android:supportsPictureInPicture="true"` on `MainActivity`.

## Previous Implementation (Flutter)

Flutter used `chewie` over `video_player` (see `flutter-archive/pubspec.yaml`).
The RN implementation matches the feature set of the Flutter player plus:
- HLS quality variant selection
- react-native-track-player background audio (replaces Flutter background_player workaround)
- PiP via react-native-video prop (replaces Flutter pip_flutter package)
