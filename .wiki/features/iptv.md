# IPTV

nTV includes a free IPTV M3U player. No nSelf backend is required. No license key is needed. Add an M3U playlist URL in Settings and browse live channels immediately.

---

## Adding a Playlist

1. Open Settings (bottom nav bar, gear icon).
2. Scroll to the **IPTV** section.
3. Tap **Add M3U URL**.
4. Enter a valid M3U playlist URL (e.g., `http://provider.example.com/playlist.m3u`).
5. Tap **Add**. The playlist is saved to `SharedPreferences` under `ntv_m3u_urls`.

Multiple playlists are supported. Each URL appears as a separate entry in the list. Tap the trash icon next to any entry to remove it.

M3U URLs are stored locally on the device. They are never sent to an nSelf backend.

---

## Channel Browser

The IPTV channel browser parses the M3U file and groups channels by the `group-title` attribute in the `#EXTINF` header. Each group appears as a filter chip at the top of the channel list. Select a group to filter channels. Select "All" to show every channel across all playlists.

Each channel card shows:
- Channel name (from `#EXTINF` display name)
- Group label
- Channel logo if provided by `tvg-logo` attribute

Tap a channel to open the player. The stream URL is the M3U entry URL, passed directly to `VideoPlayerController.networkUrl()`.

---

## EPG Integration

If your M3U includes `tvg-id` attributes and your nSelf backend has the `epg` plugin installed, nTV matches channels to EPG data. The now-playing program name and time appear below the channel name in the browser.

IPTV EPG requires:
- Channels in the M3U with `tvg-id` values that match your EPG source
- `epg` plugin installed on your nSelf backend
- Backend URL configured in Settings

Without the backend, the channel browser works but EPG data is not shown.

---

## Playback

IPTV streams play in the same `PlayerScreen` as library content. The back button returns to the channel browser. Progress is not saved for live streams (there is no meaningful position to resume).

Live streams use whatever format the provider supplies — typically HLS (`application/x-mpegURL`) or MPEG-TS direct UDP. `video_player` handles both on most platforms. MPEG-TS direct UDP is not supported on Web.

---

## Platform Notes

| Platform | Live HLS | MPEG-TS | Notes |
|----------|----------|--------|-------|
| iOS | Yes | Yes | AVPlayer |
| macOS | Yes | Yes | AVPlayer |
| Android | Yes | Yes | ExoPlayer |
| Windows | Yes | Limited | platform video_player |
| Linux | Yes | Limited | platform video_player |
| Web | Yes | No | HTML5 + HLS.js; no UDP |
