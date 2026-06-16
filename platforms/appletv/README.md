# nTV — Apple TV / Android TV

react-native-tvos app for nTV. Targets tvOS 17+ (Apple TV 4K) and Android TV / Fire TV.

## Stack

- [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos) — community fork adding tvOS + Android TV to RN
- TypeScript strict mode
- NativeWind v4 (TV-compatible subset)
- @nself/* shared packages

## Running

```bash
# Install deps (from repo root — pnpm workspace)
pnpm install

# tvOS Simulator
pnpm run tvos

# Android TV emulator
pnpm run androidtv
```

## TV Nav model

- All navigation via `TVEventHandler` (Siri Remote / D-pad)
- `hasTVPreferredFocus` on first interactive element of every screen
- No touch events, no PinchZoom, no swipe gestures
- `Platform.isTV` guard on any shared-code branch

## EAS Build profiles

| Profile | Target | Notes |
|---------|--------|-------|
| `tvos` | Apple TV (tvOS 17+) | `org.nself.ntv.tvos` |
| `androidtv` | Android TV | `org.nself.ntv.androidtv` |
| `firetv` | Amazon Fire TV | APK distribution |

```bash
eas build --profile tvos --platform ios
eas build --profile androidtv --platform android
eas build --profile firetv --platform android
```

## Screen implementation

Screens T02-T05 (player, channel list, EPG, settings) are wired in the following
sprints. This scaffold provides the root component, navigation shell, and
TVEventHandler wiring.
