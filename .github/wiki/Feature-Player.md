# Player

**Status:** Active

## Overview

The Player is the core playback surface of nTV. It plays a single media item (movie, episode, or live channel) on whichever platform the user opened the app on.

The Player wraps `chewie` over `video_player`, so it inherits the per-platform decoder support of those packages: AVPlayer on iOS / macOS, ExoPlayer on Android, community plugins on Linux / Windows, and HTML5 `<video>` (with HLS.js polyfill where needed) on Web.

Underneath, the stream URL comes from the backend `streaming` plugin. nTV does not encode or transcode anything — it asks the backend for an HLS or DASH playlist and plays it.

## Requirements

| Item | Required | Notes |
|------|----------|-------|
| nSelf CLI | latest stable | F01-MASTER-VERSIONS |
| Plugin: `streaming` | Yes | Pro — F06 nMedia bundle |
| Plugin: `media-processing` | Yes | Pro — F06 nMedia bundle |
| Plugin: `tmdb` | Yes (for metadata while playing) | Pro — F06 nMedia bundle |
| Plugin: `subtitle-manager` | Optional | Pro — for subtitle search beyond the .srt currently bundled with the media |
| Tier | Bundle: nMedia ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nMedia | per F06-BUNDLE-INVENTORY |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `STREAMING_HLS_SEGMENT_DURATION` | `6` | HLS segment length in seconds (backend) |
| `STREAMING_MAX_BITRATE` | unlimited | Cap on adaptive bitrate (backend) |
| `STREAMING_PROGRESS_INTERVAL_MS` | `10000` | App-side progress report cadence (planned setting) |

App-side toggles (planned in Settings screen):

- Default playback quality (Auto / 1080p / 720p / 480p)
- Hardware decode (on / off — off until validated per platform)
- Default subtitle language

## Usage

### Play a movie

User taps a title from the Library. `go_router` navigates to `/play/:id`. The player loads, fetches the stream URL, and starts playback.

```dart
// Conceptual — actual code arrives in MVP T-005
context.go('/play/$movieId');
```

### Resume from another device

When opening a title that has a stored progress > 0 from any device, the player asks "Resume from 23:45?" or "Start over?".

This requires sync (per F-40, T-011 in active.md).

## Limitations

- HLS support on Linux and Windows depends on community plugins and may degrade. MP4 progressive download fallback is planned.
- DRM (Widevine on Android, FairPlay on iOS, EME on Web) is planned for v0.5+.
- 4K HDR support depends on platform decoders and is not validated yet.
- Background play requires per-platform setup (see Limitations of `video_player` per L-002).

### Known issues

None tracked yet.

## Troubleshooting

### Playback never starts

**Symptom:** Player screen loads but the video does not begin.
**Cause:** Backend `streaming` plugin is not installed, or the stream URL is wrong, or codecs are unsupported on the platform.
**Fix:** Run `nself plugin install streaming && nself build && nself start` on the backend. Check the player's error overlay for codec issues.

### Audio plays but video is black

**Symptom:** Sound is audible; video frame is black or blank.
**Cause:** Hardware decode mismatch with the source codec.
**Fix:** Toggle hardware decode off in Settings. If the issue persists, file an issue with the source codec details.

### Subtitles do not load

**Symptom:** "Subtitles" menu is empty even though the file has them.
**Cause:** Subtitles are baked into the container (ASS / SSA), or `subtitle-manager` is not installed.
**Fix:** Install `subtitle-manager` (Pro) on the backend. ASS / SSA support is post-v1.0.

## Related

- [[Feature-Library]] — feature page
- [[Feature-Settings]] — feature page (player prefs)
- [[Feature-Sync]] — feature page (resume position)
- [[Backend-Setup]] — install the nMedia bundle

← [[Home]]
