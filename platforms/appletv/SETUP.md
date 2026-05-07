# Apple TV — Flutter tvOS Setup

## Status

Flutter tvOS is supported via the `flutter create --platforms=tvos` flow (Flutter 3.13+).
The nTV Apple TV target uses the **same Flutter app** (`lib/`) as iOS, with tvOS-specific
adaptations for focus navigation and the large-screen layout.

## One-time setup (local dev)

```bash
# From the repo root
flutter create --platforms=tvos .

# This adds tvos/ directory with Xcode project targeting tvOS 17+
# Open in Xcode to verify the target:
open ntv.xcworkspace   # inside tvos/
```

## Known Flutter tvOS limitations (as of Flutter 3.24)

| Issue | Impact | Mitigation |
|---|---|---|
| Focus traversal engine is partial | D-pad nav may skip widgets | Use `FocusNode` + `Focus` wrapper on all interactive widgets |
| `video_player` plugin lacks tvOS entitlement | AVKit missing | Use `media_kit` instead (already in pubspec.yaml) — supports tvOS |
| Remote swiping gestures | Some gestures map to scroll, not tap | Wrap tappable items in `GestureDetector` with `onTap` |
| Background audio | Works via `audio_service` | Already in pubspec.yaml |

## Fallback plan (per UD-24)

If Flutter tvOS remains unstable at v1.1.0 ship date, file:
`.claude/ideas/native-swift-appletv-port.md` — `status: deferred` for v1.2.0.

The CI job (`release-appletv`) will produce a warning artifact instead of a .ipa
so the release is not blocked.

## Build (local)

```bash
flutter build ipa \
  --dart-define=FLAVOR=free \
  --release \
  --export-options-plist platforms/appletv/ExportOptions.plist
```

## Xcode configuration

Ensure these are set on the tvOS target in Xcode:

- **Deployment Target:** tvOS 16.0+
- **Bundle ID:** `org.nself.ntv.tv`
- **Signing:** Match / Fastlane (same profile as iOS, different bundle ID)
- **Capabilities:** Network access, Background Modes (audio, fetch)
