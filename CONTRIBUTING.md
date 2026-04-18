# Contributing to nTV

## What This Is

nTV is an open-source media player built with Flutter for 6 platforms (iOS, Android, macOS, Windows, Linux, web). It uses the nSelf backend with the nTV plugin bundle.

## Prerequisites

- Flutter 3.24+
- Dart 3.5+
- nSelf CLI (for media backend)

## Setup

```bash
git clone https://github.com/nself-org/ntv
cd ntv
flutter pub get
flutter run
```

## Development

```bash
flutter test        # run tests
flutter analyze     # static analysis
```

## Pull Requests

1. Fork and create a branch
2. `flutter analyze` must pass clean
3. Submit PR against `main`

## Commit Style

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
