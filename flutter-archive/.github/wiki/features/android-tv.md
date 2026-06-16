# Android TV Support

nTV includes a native Android TV interface built with Flutter's Leanback-compatible layout system. The 10-foot UI is optimized for D-pad navigation and large screens.

---

## Requirements

- nTV Flutter app built with Android TV target
- Android TV device (or Android device running Launcher → TV mode)

---

## Leanback Launcher

nTV registers with the Android TV launcher:

- **Banner image:** 320×180 px banner shown in the launcher row
- **Deeplinks:** direct links to Home, Library, Channels, and Search rows in the launcher
- **Intent filters:** handles `CATEGORY_LEANBACK_LAUNCHER` intent

---

## D-Pad Navigation

All nTV screens support full D-pad navigation:

| Key | Action |
|-----|--------|
| D-pad Up/Down/Left/Right | Move focus |
| Center / Enter | Select / Play |
| Back | Go back |
| Play/Pause | Toggle playback |
| Fast Forward / Rewind | Skip ±10s |
| Menu | Open context menu |

Focus is managed by Flutter's `FocusNode` tree. Every interactive element has a named focus node for reliable D-pad traversal.

---

## AmbientScreensaver

When idle for 5 minutes (configurable via `NTV_SCREENSAVER_IDLE_SEC`), nTV activates the ambient screensaver:

- Cycles through backdrop images from your library (TMDB backdrops)
- Displays date, time, and current weather (if `WEATHER_API_KEY` is set)
- A D-pad press or remote button dismisses the screensaver

The screensaver uses Android's `DreamService` API to integrate with the system.

---

## MediaSession Integration

nTV integrates with Android's MediaSession API for:

- Lock screen media controls
- "Now playing" card in the launcher
- Google Assistant voice commands ("Hey Google, pause nTV")
- Chromecast sender (nTV can cast to another device from the Android TV interface)

---

## Performance on Android TV

nTV targets a minimum of 60 fps on Android TV hardware from 2020+. For older hardware:

- Set `NTV_TRANSCODE_MAX_RENDITION=1080p` to avoid serving 4K segments to the TV
- Disable subtitle rendering if framerate drops: `NTV_SUBTITLES_ENABLED=false`
