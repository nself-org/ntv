# nTV Wiki

nTV is an open-source media player for your self-hosted content. Built with Flutter, it runs on six platforms: iOS, Android, macOS, Windows, Linux, and Web. It connects to a self-hosted nSelf backend powered by the nTV plugin bundle.

**Free use:** Add any IPTV M3U playlist in Settings and browse live channels immediately. No nSelf backend required, no license key needed.

**Full library mode:** Self-host your media collection using nSelf CLI with the nTV plugin bundle ($0.99/mo). Unlocks library management, adaptive streaming, metadata, EPG, and progress sync.

**Repo:** [nself-org/ntv](https://github.com/nself-org/ntv)
**Marketing site:** [ntv.nself.org](https://ntv.nself.org)
**License:** MIT

---

## Wiki Pages

### Getting Started

- [Getting Started](getting-started) — prerequisites, clone, run, first launch

### Architecture

- [Architecture](architecture) — state management, routing, HTTP, video playback, data flow

### Features

- [Library](features/library) — media library grid, search, filtering, continue watching
- [Player](features/player) — full-screen playback, progress saving, subtitles, quality
- [IPTV](features/iptv) — M3U playlists, channel browser, EPG integration
- [EPG](features/epg) — Electronic Program Guide screen

### Reference

- [Plugins](plugins) — nTV plugin table with install commands
- [Platforms](platforms) — per-platform status, limitations, build commands
- [Contributing](contributing) — Flutter conventions, code style, PR process

---

## Quick Reference

| Platform | Video Engine | Status |
|----------|-------------|--------|
| iOS | AVPlayer (via video_player) | Active |
| macOS | AVPlayer (via video_player) | Active |
| Android | ExoPlayer (via video_player) | Active |
| Windows | platform video_player | Active |
| Linux | platform video_player | Active |
| Web | HTML5 + HLS.js | Active |

| Feature | Requires |
|---------|---------|
| IPTV M3U playback | Nothing (free) |
| Library management | nTV bundle ($0.99/mo) |
| Adaptive streaming | `streaming` + `stream-gateway` plugins |
| Metadata (TMDB) | `tmdb` plugin |
| EPG guide | `epg` plugin |
| Progress sync | Any nSelf backend with `streaming` plugin |
