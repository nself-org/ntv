# Platforms

**Status at v1.0.9:** Free IPTV player — Flutter code ships for multiple platforms, but no binaries are submitted to any app store at v1.0.9. Store submissions (iOS App Store, Google Play, macOS Mac App Store) are coming in v1.1.0. Release builds are unsigned. Roku, Apple TV, Samsung, LG Smart TV targets are v1.1.0+.

nTV targets six platforms. This page covers per-platform status, known limitations, and build commands.

---

## Platform Matrix

| Platform | Video Engine | HLS | Background Playback | Media Controls | Status |
|----------|-------------|-----|--------------------|----|--------|
| iOS | AVPlayer | Excellent | Yes (with background modes entitlement) | Lock screen / Control Center | Active |
| macOS | AVPlayer | Excellent | Yes | Touch Bar / media keys | Active |
| Android | ExoPlayer | Excellent | Yes (media notification) | Notification controls | Active |
| Windows | video_player (libVLC) | Good | No | None | Active |
| Linux | video_player (libVLC) | Good | No | None | Active |
| Web | HTML5 + HLS.js | Good | No (browser tab only) | None | Active |

---

## iOS

**Video engine:** AVPlayer via the `video_player` plugin.

HLS streams (returned by `stream-gateway`) play natively through AVPlayer. Adaptive bitrate is handled by the system.

**Background playback:** Add the `audio` background mode to your `ios/Runner/Info.plist` entitlements to allow playback when the screen locks. Without this, playback pauses on screen lock.

**Known limitations:**
- Local network access requires the `NSLocalNetworkUsageDescription` key in `Info.plist` for backends on the same network.
- DRM-protected streams require a native AVContentKeySession integration not currently in this repo.

**Build:**
```bash
flutter build ios
# Or open ios/Runner.xcworkspace in Xcode for signing and upload
```

---

## macOS

**Video engine:** AVPlayer, same as iOS.

Background playback works without additional entitlements on macOS. The app runs in a standard macOS window with full menu bar integration.

**Known limitations:**
- macOS App Sandbox restricts outbound network connections to declared domains. For self-hosted backends on arbitrary domains, add `com.apple.security.network.client` to the entitlements file (already present in the scaffold).

**Build:**
```bash
flutter build macos
```

---

## Android

**Video engine:** ExoPlayer via the `video_player` plugin.

ExoPlayer has first-class HLS support. Adaptive bitrate switches between quality levels automatically.

Background playback works through a foreground service with a media notification. ExoPlayer manages the notification with play/pause/skip controls visible on the lock screen.

**Known limitations:**
- Cleartext HTTP (non-HTTPS) backends require `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` for local dev.
- DRM-protected streams require ExoPlayer MediaDrm integration.

**Build:**
```bash
flutter build apk        # debug APK
flutter build appbundle  # release AAB for Play Store
```

---

## Windows

**Video engine:** platform `video_player` plugin (uses Windows Media Foundation or libVLC depending on the plugin implementation).

HLS playback works for standard streams. Complex adaptive streams may fall back to a fixed quality.

**Known limitations:**
- Background playback is not supported. Playback pauses when the window loses focus if the system is resource-constrained.
- No OS-level media controls (Windows does not surface them to non-UWP apps via this plugin).
- Hardware video acceleration depends on the driver and plugin build.

**Build:**
```bash
flutter build windows
```

---

## Linux

**Video engine:** platform `video_player` plugin (typically libVLC or libmpv-based on the installed plugin).

Requires `libgtk-3-dev` and the video player native libraries to be installed on the build machine.

**Known limitations:**
- Background playback is not supported.
- No OS-level media controls.
- GTK theming may conflict with the Material 3 dark theme on some desktop environments.

**Build:**
```bash
flutter build linux
```

---

## Web

**Video engine:** HTML5 `<video>` element. HLS streams require HLS.js, which is injected automatically by the `video_player` web implementation.

**Known limitations:**
- Background playback is not supported — browsers suspend media when the tab is hidden.
- No media session controls (the browser media bar is not wired).
- MPEG-TS direct UDP streams are not supported (browser security prevents raw UDP).
- CORS: your nSelf backend must allow the web app's origin in its Nginx configuration, or streams will be blocked.
- Safari has native HLS support in the `<video>` element; Chrome uses HLS.js. Both work for standard HLS.

**CORS config:** Add the web app's origin to your nSelf backend Nginx config:

```nginx
add_header Access-Control-Allow-Origin "https://your-ntv-web-domain.example.com";
```

**Build:**
```bash
flutter build web
# Output in build/web/ — serve with any static host
```

← [[Home]]
