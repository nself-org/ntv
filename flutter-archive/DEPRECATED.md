# Flutter Archive — DEPRECATED

**Status:** ARCHIVED — Flutter source superseded by React Native + Expo rewrite (P3-E4).
**Archived:** 2026-06-16 (T-P3-E4-W2-S4-T09)
**Replaced by:** `ntv/` root — React Native + Expo v53 app

---

## What this archive contains

This directory is a snapshot of the original nTV Flutter 3.10 app source code before the
React Native + Expo migration (P3-E4). It is preserved as a read-only reference.

Contents:
- `lib/` — Flutter Dart source (6-platform: iOS, Android, macOS, Linux, Windows, Web)
- `ios/` / `android/` / `macos/` / `linux/` / `windows/` / `web/` — platform scaffolds
- `test/` — Flutter unit tests
- `pubspec.yaml` / `pubspec.lock` — Flutter dependency manifest
- `backend/` — legacy backend integration stubs

---

## Why archived

Per nSelf ASI Frontend Policy (P3 decision 2026-06-16):
- Flutter is eliminated from the nSelf stack (no tvOS support, no shared TypeScript code)
- Replaced by React Native + Expo (mobile: iOS + Android) + react-native-tvos (TV platforms)
- All Flutter features are replicated in the RN rewrite with 0 gaps (see parity matrix)
- Parity matrix: `.claude/docs/parity-matrix.md`

---

## Do not modify

This archive is read-only. Do not make changes to files in this directory.
New features and bug fixes go in the `ntv/` root (RN app).

---

## CI status

Flutter CI jobs (`ci-flutter.yml`, `flutter-test.yml`) were removed as part of T09.
The RN app uses EAS Build for production iOS + Android builds.
