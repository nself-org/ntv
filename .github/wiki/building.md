# Building nTV

nTV targets iOS, Android, macOS, and Windows. All platforms share the same Dart codebase.

## Prerequisites

| Tool | Version |
|---|---|
| Flutter | >= 3.24.0 |
| Dart | >= 3.5.0 |
| Xcode | >= 15 (macOS/iOS only) |
| Android Studio | >= Hedgehog (Android only) |
| Visual Studio with C++ workload | (Windows only) |

## Get dependencies

```bash
cd ntv
flutter pub get
```

## Flavors

nTV ships in two flavors:

| Flavor | Bundle active | Use for |
|---|---|---|
| `free` | No | Default public build |
| `pro` | Yes | Users with active nTV Bundle ($0.99/mo) |

Pass the flavor at build time via `--dart-define=FLAVOR=<free|pro>`.

## Build commands

### Android

```bash
# Debug APK (free)
flutter build apk --dart-define=FLAVOR=free

# Release AAB for Play Store (free)
flutter build appbundle --dart-define=FLAVOR=free --release

# Release AAB (pro)
flutter build appbundle --dart-define=FLAVOR=pro --release
```

### iOS

```bash
# Debug run on connected device
flutter run --dart-define=FLAVOR=free

# Release IPA (requires Apple Developer account)
flutter build ipa --dart-define=FLAVOR=free --release --export-options-plist ios/ExportOptions.plist
```

### macOS

```bash
flutter build macos --dart-define=FLAVOR=free --release
# Output: build/macos/Build/Products/Release/nTV.app
```

### Windows

```bash
flutter build windows --dart-define=FLAVOR=free --release
# Output: build/windows/x64/runner/Release/
```

## Running tests

```bash
flutter test                          # all tests
flutter test --coverage               # with lcov coverage output
flutter test test/unit/               # unit tests only
```

Coverage target: >= 70% on `lib/`.

## Signing (release)

See `release.yml` for the GitHub Actions signing setup. Required secrets:

| Secret | Used for |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Android upload keystore (base64) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play Console upload |
| `APPLE_ID` | Apple Developer email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for altool |
| `APPLE_TEAM_ID` | 10-character Apple team ID |
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API key |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect issuer UUID |

**Windows MSIX signing** requires an EV code-signing certificate. Vendor is TBD — this is a USER DECISION pending procurement. Until resolved, Windows builds are unsigned.
