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
| Plugin: `streaming` | Yes | Pro — F06 nTV bundle |
| Plugin: `media-processing` | Yes | Pro — F06 nTV bundle |
| Plugin: `tmdb` | Yes (for metadata while playing) | Pro — F06 nTV bundle |
| Plugin: `subtitle-manager` | Optional | Pro — for subtitle search beyond the .srt currently bundled with the media |
| Tier | Bundle: nTV ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nTV | per F06-BUNDLE-INVENTORY |

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

## Implementation Detail

### Opening the Player

The player is reached from the detail screen via the **Play** button, or from the episode list on a TV show detail. The route is `/player?mediaId=<id>`.

On init, `PlayerScreen` calls `ApiService.getStreamUrl(mediaId)`, which hits `GET /streaming/play/:id` on the backend. The `stream-gateway` plugin returns a `StreamInfo` object:

```json
{
  "url": "https://your-server.example.com/hls/abc123/index.m3u8",
  "format": "hls",
  "headers": {
    "Authorization": "Bearer ..."
  }
}
```

The URL and headers are passed to `VideoPlayerController.networkUrl()`.

### Video Controls

Controls are provided by `chewie` overlaid on the `video_player` widget. Available controls:

- Play / pause
- Seek bar with buffering indicator
- Volume control
- Full-screen toggle (enters true full-screen on platforms that support it)
- Back button (top-left overlay, always visible)

Controls auto-hide after a few seconds of inactivity (`showControlsOnInitialize: false`).

### Orientation

The player forces landscape orientation on entry via `SystemChrome.setPreferredOrientations([landscapeLeft, landscapeRight])` and enables immersive sticky mode to hide system UI. On dispose, both are restored to their previous values.

### Adaptive Streaming

The `stream-gateway` plugin on the backend selects the stream URL based on the client's `preferred_quality` setting (sent as a query parameter). Quality options: `auto`, `1080p`, `720p`, `480p`. `auto` lets the backend pick based on available transcoded variants.

The `streaming` plugin generates HLS segments. `stream-gateway` proxies them and injects auth headers. The client does not negotiate bitrate directly — the backend handles adaptive bitrate selection.

### Progress Saving

A listener on `VideoPlayerController` fires on every position change. When the position has moved at least 10 seconds from the last saved position, `ApiService.saveProgress(mediaId, position)` is called:

```
POST /streaming/progress
{ "media_id": "abc123", "position_seconds": 1234 }
```

Errors from the progress endpoint are silently ignored so playback is never interrupted by a network hiccup.

Saved progress feeds into the continue-watching row on the Library screen.

### Subtitle Support

Subtitle files are managed by the `subtitle-manager` plugin on the backend. The stream URL returned by `stream-gateway` may include a subtitle track when the plugin is installed. `video_player` surfaces subtitle tracks through the platform decoder where supported (AVPlayer on iOS/macOS, ExoPlayer on Android).

On Linux, Windows, and Web, external subtitle track support depends on the platform video_player plugin version.

### Quality Selection

Quality is set in Settings under **Preferred quality**: `auto`, `1080p`, `720p`, or `480p`. The selected value is stored in `SharedPreferences` under `ntv_preferred_quality` and read by the backend when generating the stream URL.

### Error States

| Condition | Display |
|-----------|--------|
| Backend not configured | "Backend not configured. Go to Settings first." |
| Stream fetch fails | "Failed to load stream: \<error message\>" |
| Player init error | chewie's built-in error overlay: "Playback error: \<message\>" |
| No mediaId provided | "No media selected." with prompt to choose from library |

All error states include a **Go Back** button.

## Related

- [[Feature-Library]] — feature page
- [[Feature-Settings]] — feature page (player prefs)
- [[Feature-Sync]] — feature page (resume position)
- [[Backend-Setup]] — install the nTV bundle

← [[Home]]
