# ɳTV Casting — Chromecast + AirPlay

**Stack:** react-native-google-cast (Chromecast) · expo-av AudioVideoRoutePicker (AirPlay, iOS only)

---

## Overview

ɳTV supports casting the current IPTV stream to a TV via:

- **Chromecast** — any Chromecast device on the same local network (Android + iOS)
- **AirPlay** — Apple TV or AirPlay 2 receiver (iOS only)

The `CastButton` component and `useCast` hook handle the full lifecycle.

---

## Architecture

```
CastButton.tsx          ← renders GoogleCastButton + AirPlay picker + status label
  └── useCast.ts        ← state machine: disconnected | connecting | connected
        ├── useCastState()            (react-native-google-cast)
        ├── useRemoteMediaClient()    (react-native-google-cast)
        └── AudioVideoRoutePicker    (expo-av, iOS only)
```

---

## Chromecast Setup (react-native-google-cast)

### iOS (AppDelegate.mm)

GoogleCastContext must be initialised before first use. The T01 scaffold adds:

```objc
#import <GoogleCast/GoogleCast.h>

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

  GCKDiscoveryCriteria *criteria =
      [[GCKDiscoveryCriteria alloc] initWithApplicationID:kGCKDefaultMediaReceiverApplicationID];
  GCKCastOptions *options =
      [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
  [GCKCastContext setSharedInstanceWithOptions:options];
  // ... rest of app setup
}
```

### Android (build.gradle)

react-native-google-cast auto-links on Android. No manual configuration required for the default media receiver.

---

## AirPlay (iOS only)

expo-av exposes `AudioVideoRoutePicker` which wraps `AVRoutePickerView`. It renders the system AirPlay button. No additional configuration is required — iOS handles device discovery automatically.

`CastButton` renders `AudioVideoRoutePicker` only when `Platform.OS === 'ios'`.

---

## Component API

### `<CastButton />`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `streamUrl` | `string` | yes | The IPTV stream URL to cast |
| `streamTitle` | `string` | yes | Channel name shown on receiver |
| `contentType` | `string` | no | MIME type; default `application/x-mpegURL` |
| `onLocalPlaybackStop` | `() => void` | no | Called when cast starts — pause local video |
| `onLocalPlaybackResume` | `(pos: number) => void` | no | Called when cast ends — resume at `pos` seconds |
| `style` | `ViewStyle` | no | Outer container style |

```tsx
import { CastButton } from '../components/CastButton';

// Inside PlayerControls:
<CastButton
  streamUrl={currentStreamUrl}
  streamTitle={channelName}
  onLocalPlaybackStop={() => videoRef.current?.pause()}
  onLocalPlaybackResume={(pos) => {
    videoRef.current?.seek(pos);
    videoRef.current?.resume();
  }}
/>
```

### `useCast()` hook

```ts
import { useCast } from '../hooks/useCast';

const {
  status,         // 'disconnected' | 'connecting' | 'connected'
  deviceName,     // 'Living Room TV' | null
  startCast,      // () => Promise<void>
  stopCast,       // () => Promise<void>
  pauseRemote,    // () => Promise<void>
  resumeRemote,   // () => Promise<void>
  seekRemote,     // (seconds: number) => Promise<void>
  lastPosition,   // number — seconds, polled every 5s while connected
  isAirPlayAvailable, // boolean — true on iOS only
} = useCast({ streamUrl, streamTitle, onLocalPlaybackStop, onLocalPlaybackResume });
```

---

## Cast Lifecycle

```
User taps CastButton
  → OS native device picker
  → user selects Chromecast device
  → useCast.startCast() called
  → loadMedia(streamUrl) sent to remote client
  → onLocalPlaybackStop() fired → local video pauses
  → status: 'connected', deviceName: 'Living Room TV'
  → Player UI shows "Casting to Living Room TV"

User taps Stop Cast
  → useCast.stopCast() called
  → lastPosition captured
  → client.stop() called
  → onLocalPlaybackResume(lastPosition) fired → local video seeks + resumes
  → status: 'disconnected'
```

---

## UI States

| Status | GoogleCastButton tint | Status label |
|--------|----------------------|--------------|
| `disconnected` (no device) | hidden (SDK auto-hides) | — |
| `disconnected` (device available) | white (idle cast icon) | — |
| `connecting` | white (animated) | "Connecting…" |
| `connected` | white (active icon) | "Casting to DeviceName" |

---

## Known Limitations

- **No custom receiver app** — uses Google's default media receiver (`kGCKDefaultMediaReceiverApplicationID`). Custom branding requires a registered Chromecast receiver app.
- **RTSP streams** — the default receiver does not support RTSP. HLS and DASH streams cast reliably.
- **Android TV casting** — covered in S5 (TV platform sprint). This implementation is phone/tablet only.
- **AirPlay seek** — `AudioVideoRoutePicker` does not expose seek controls; AirPlay mirroring is managed by the OS once the route is selected.

---

## Testing

**QA-A (physical device required):**
1. Connect iOS/Android device and Chromecast to the same Wi-Fi network.
2. Open ɳTV → tap any live channel → player opens.
3. Tap the cast button → device picker appears → select Chromecast.
4. Stream plays on TV. Player shows "Casting to [DeviceName]".
5. Tap stop cast → local playback resumes at correct position.

**QA-A (AirPlay — iOS only):**
1. Open ɳTV → player open → tap the AirPlay button.
2. AirPlay device list appears → select Apple TV.
3. Stream routes to Apple TV.

---

*Updated: T-P3-E4-W2-S4-T04 (P3 W2 S4) — Flutter casting stub replaced with react-native-google-cast implementation.*
