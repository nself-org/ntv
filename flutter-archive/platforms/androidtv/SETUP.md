# Android TV — Setup & CI

## How it works

Android TV is the **same Flutter app** as the phone Android build. The TV-specific changes are:

1. `android/app/src/main/AndroidManifest.xml` — Leanback feature declaration + launcher activity
2. D-pad focus management in Flutter (`FocusNode`, `Focus` widgets)
3. `media_kit` for video (already in pubspec.yaml — supports ExoPlayer / AndroidX Media3 on TV)

## Changes made (T19)

- Added `<uses-feature android:name="android.software.leanback" android:required="true"/>` to manifest
- Added `<uses-feature android:name="android.hardware.touchscreen" android:required="false"/>` (required for TV)
- Added Leanback `LEANBACK_LAUNCHER` intent filter to MainActivity

## Build

```bash
flutter build appbundle \
  --dart-define=FLAVOR=free \
  --release
```

The same AAB is submitted to both the phone track and the TV track in Google Play.

## D-pad navigation notes

Ensure all interactive widgets use `FocusNode` so the remote D-pad navigates correctly:

```dart
Focus(
  focusNode: myFocusNode,
  onKeyEvent: (node, event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.select) {
      // handle OK/select press
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  },
  child: YourWidget(),
)
```

## Media3 / ExoPlayer

`media_kit` wraps ExoPlayer (AndroidX Media3) on Android. No additional setup needed.
HLS streams play via `VideoController` + `Video` widget from `media_kit_video`.
