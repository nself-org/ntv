# Player

The Player screen provides full-screen video playback for items in your nSelf media library.

**Requires:** nSelf backend with `streaming` and `stream-gateway` plugins installed.

---

## Opening the Player

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

---

## Video Controls

Controls are provided by [chewie](https://pub.dev/packages/chewie) overlaid on the `video_player` widget. Available controls:

- Play / pause
- Seek bar with buffering indicator
- Volume control
- Full-screen toggle (enters true full-screen on platforms that support it)
- Back button (top-left overlay, always visible)

Controls auto-hide after a few seconds of inactivity (`showControlsOnInitialize: false`).

---

## Orientation

The player forces landscape orientation on entry via `SystemChrome.setPreferredOrientations([landscapeLeft, landscapeRight])` and enables immersive sticky mode to hide system UI. On dispose, both are restored to their previous values.

---

## Adaptive Streaming

The `stream-gateway` plugin on the backend selects the stream URL based on the client's `preferred_quality` setting (sent as a query parameter). Quality options: `auto`, `1080p`, `720p`, `480p`. `auto` lets the backend pick based on available transcoded variants.

The `streaming` plugin generates HLS segments. `stream-gateway` proxies them and injects auth headers. The client does not negotiate bitrate directly — the backend handles adaptive bitrate selection.

---

## Progress Saving

A listener on `VideoPlayerController` fires on every position change. When the position has moved at least 10 seconds from the last saved position, `ApiService.saveProgress(mediaId, position)` is called:

```
POST /streaming/progress
{ "media_id": "abc123", "position_seconds": 1234 }
```

Errors from the progress endpoint are silently ignored so playback is never interrupted by a network hiccup.

Saved progress feeds into the continue-watching row on the Library screen.

---

## Subtitle Support

Subtitle files are managed by the `subtitle-manager` plugin on the backend. The stream URL returned by `stream-gateway` may include a subtitle track when the plugin is installed. `video_player` surfaces subtitle tracks through the platform decoder where supported (AVPlayer on iOS/macOS, ExoPlayer on Android).

On Linux, Windows, and Web, external subtitle track support depends on the platform video_player plugin version.

---

## Quality Selection

Quality is set in Settings under **Preferred quality**: `auto`, `1080p`, `720p`, or `480p`. The selected value is stored in `SharedPreferences` under `ntv_preferred_quality` and read by the backend when generating the stream URL.

---

## Error States

| Condition | Display |
|-----------|--------|
| Backend not configured | "Backend not configured. Go to Settings first." |
| Stream fetch fails | "Failed to load stream: \<error message\>" |
| Player init error | chewie's built-in error overlay: "Playback error: \<message\>" |
| No mediaId provided | "No media selected." with prompt to choose from library |

All error states include a **Go Back** button.
