# nTV TV Parity Matrix — T-P3-E4-W2-S5-T07

**Date:** 2026-06-16
**Ticket:** T-P3-E4-W2-S5-T07
**Parity source:** TV Platform Decisions doc §6 (T-P3-E4-W1-S2-T02)
**Implementation:** `ntv/platforms/appletv/` (react-native-tvos)

---

## §6 Feature Parity Table

| # | Feature (Flutter tvOS) | Flutter API | rn-tvos Implementation | Status | Gap |
|---|---|---|---|---|---|
| 1 | D-pad / Remote navigation | `FocusNode`-aware default Flutter nav | `TVEventHandler` (`useTVEventHandler` hook) + `hasTVPreferredFocus` on first element | ✅ Complete | None |
| 2 | Landscape-only lock | `SystemChrome.setPreferredOrientations([landscape])` | `orientation: "landscape"` in `app.json`; `react-native-screens` orientation lock at runtime | ✅ Complete | None |
| 3 | Focus color theming | `ThemeData(focusColor: Color(0xFF0ea5e9))` | `StyleSheet` focused state override (`btnFocused: { backgroundColor: '#38bdf8', transform: [scale(1.06)] }`) in all interactive components | ✅ Complete | None |
| 4 | Background audio | `audio_service` Flutter plugin | `expo-av` + `android:launchMode="singleTop"` in tvOS manifest (per §6 mitigation) | ✅ Complete | None |
| 5 | Material 3 design tokens | `ColorScheme.fromSeed` | `nativewind` v4 + custom theme context (sky/gray design token palette) | ✅ Complete | Cosmetic only (no seeded palette generator in RN — acceptable post-launch per §6) |
| 6 | HLS / Video player | `media_kit` Flutter plugin | `react-native-video` (`PlayerScreen.tsx`) — HLS/DASH/MP4/RTSP, quality picker, PiP | ✅ Complete | None |
| 7 | Siri Remote gesture handling | Partial swipe quirks (documented in SETUP.md) | `TVEventHandler` covers all remote events: select, playPause, menu, up, down, left, right, longSelect, longMenu | ✅ Complete | rn-tvos actually improves on Flutter here |

**Unresolved gaps: 0**

---

## Screen Coverage

| Screen | Implemented | File | Notes |
|---|---|---|---|
| Home (channel grid entry) | ✅ | `src/screens/HomeScreen.tsx` | `hasTVPreferredFocus` on first Pressable |
| Player (full-screen) | ✅ | `screens/PlayerScreen.tsx` | HLS/DASH via react-native-video, focus-aware controls |
| Channel List Panel | ✅ | `components/ChannelListPanel.tsx` | D-pad navigable FlatList, TVFocusGuideView |
| EPG Panel | ✅ | `components/EPGPanel.tsx` | Programme grid, remote nav, time display |
| TV Player Controls | ✅ | `components/TVPlayerControls.tsx` | Seek, play/pause, progress bar, focus overlay |
| Favorites Panel | ✅ | `src/components/FavoritesPanel.tsx` | Slide-in overlay, D-pad nav, menu-to-close |

---

## EAS Build Profiles

| Profile | Platform | Bundle ID | Status |
|---|---|---|---|
| `tvos` | iOS (tvOS target) | `org.nself.ntv.tvos` | ✅ Defined in `ntv/eas.json` |
| `androidtv` | Android | `org.nself.ntv.androidtv` | ✅ Defined in `ntv/eas.json` |
| `firetv` | Android APK | `org.nself.ntv.firetv` | ✅ Defined in `ntv/eas.json` |

EAS build commands:
```bash
# tvOS production build
eas build --platform ios --profile tvos

# Android TV production build
eas build --platform android --profile androidtv
```

---

## Performance Targets

| Metric | Target | Implementation |
|---|---|---|
| Channel list load | < 3s | Lazy-load via `useChannelListTV` hook; pagination via `onEndReached` |
| Player start | < 5s | react-native-video `bufferConfig`; IPTV streams are live HLS |
| Focus navigation | Responsive | `TVEventHandler` fires synchronously; no debounce on D-pad events |

---

## Flutter Archive Status

| Dir | Status | Superseded by |
|---|---|---|
| `ntv/platforms/appletv-flutter-archive/` | ✅ Archived | `ntv/platforms/appletv/` (rn-tvos) |

Flutter tvOS implementation archived to `appletv-flutter-archive/` in T-P3-E4-W2-S5-T01.
`DEPRECATED.md` present in archive root.

---

## Conclusion

**0 unresolved gaps.** All 7 features from TV Platform Decisions §6 are covered by the rn-tvos implementation. The single cosmetic gap (Material 3 seeded palettes) was pre-approved as acceptable post-v1.2+ polish in §6.

This document gates: **W2-S5 sprint close — ntv TV sprint closed**.
