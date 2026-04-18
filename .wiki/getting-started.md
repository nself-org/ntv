# Getting Started

This page covers everything needed to run nTV on your local machine and connect it to a backend.

---

## Prerequisites

**Required for all platforms:**

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.10 or later
- Dart 3.0 or later (included with Flutter)
- Git

**Required for backend-connected features (library, streaming, metadata):**

- nSelf CLI installed and configured (`nself --version` should succeed)
- nTV plugin bundle license ($0.99/mo) — activate via `nself license set <key>`

**Not required for IPTV M3U use.** Adding M3U playlist URLs in Settings works without any backend.

**Platform-specific toolchains:**

| Platform | Additional requirement |
|----------|----------------------|
| iOS | Xcode 15+, macOS host, Apple developer account |
| macOS | Xcode 15+ |
| Android | Android Studio or SDK tools, `ANDROID_SDK_ROOT` set |
| Windows | Visual Studio 2022 with Desktop C++ workload |
| Linux | `clang`, `cmake`, `ninja-build`, `libgtk-3-dev` |
| Web | Chrome (for `flutter run -d chrome`) |

---

## Clone and Run

```bash
git clone https://github.com/nself-org/ntv
cd ntv
flutter pub get
flutter run
```

`flutter run` auto-detects a connected device or simulator. To target a specific platform:

```bash
flutter run -d ios
flutter run -d android
flutter run -d macos
flutter run -d windows
flutter run -d linux
flutter run -d chrome
```

---

## Backend Setup

If you want to use the full library and streaming features, you need an nSelf backend with the nTV plugins installed.

See `ntv/.backend/README.md` for the backend initialization walkthrough. The short version:

```bash
# From inside ntv/.backend/
nself init
nself license set nself_pro_xxxxx...
nself plugin install streaming stream-gateway epg tmdb
nself plugin install torrent-manager content-acquisition subtitle-manager
nself build
nself start
```

Your backend URL will be something like `https://your-server.example.com` or `http://localhost:8000` for local dev.

---

## First Run

When nTV launches without a backend URL configured, the Library screen shows a "Configure Backend" prompt.

1. Open Settings (bottom navigation bar, gear icon).
2. Enter your backend URL in the **Backend URL** field.
3. Enter your API key / token if your backend requires authentication.
4. Tap **Save Connection**.

The Library screen refreshes and loads your media collection. If the backend is not reachable, the screen shows an error message with the connection details.

**Using IPTV without a backend:** Go to Settings and scroll to the IPTV section. Add an M3U playlist URL there. The IPTV channel browser works independently of the backend connection.

---

## Verify the Setup

A working setup looks like:

- Library screen shows your movies and TV shows with poster artwork
- Tapping any item opens the detail view with metadata
- Tapping Play starts video in full-screen landscape mode
- Progress is saved automatically every 10 seconds

If any of these steps fail, check the backend is running (`nself status`) and the URL in Settings matches the nSelf API endpoint.
