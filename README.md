# nTV

Open-source media player for your self-hosted content. Like Plex, but you own everything.

nTV connects to any ɳSelf backend running the nTV plugin bundle to browse, stream, and manage your media library.

## Features (Planned)
- Browse movies, TV shows, music
- Stream via HLS/DASH
- Electronic program guide (EPG)
- Subtitle management
- Multi-device sync (continue watching)
- Chromecast / AirPlay support
- Offline downloads

## Built on ɳSelf
nTV is a reference app demonstrating the nTV plugin bundle:
- stream-gateway, streaming, epg, tmdb, game-metadata
- recording, content-acquisition, media-processing, file-processing
- subtitle-manager, tokens, torrent-manager, vpn

## Getting Started
```bash
# Backend setup
nself init
nself plugin install stream-gateway streaming epg tmdb
nself build && nself start

# Run the app
cd ntv
flutter run
```

## License
MIT

---

## Status

[Active] — S24 bootstrap in progress (P93). Backend config ships via nSelf CLI. Flutter scaffold + IPTV M3U free tier + nTV bundle integration are being built. See `Roadmap` below.

[![Version](https://img.shields.io/badge/version-1.0.9-blue.svg)](https://github.com/nself-org/ntv/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Active-green.svg)](https://github.com/nself-org/ntv/wiki)
<!-- VERSION_BADGE -->

## Description

nTV is the open-source media player. The user supplies the storage and the backend. Together they cover the same ground as Plex or Jellyfin without the vendor account or the cloud sync the user did not ask for.

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | [Planned] | AVPlayer; HLS native |
| Android | [Planned] | ExoPlayer; HLS native |
| macOS | [Planned] | First MVP target (Phase 1 per ROADMAP) |
| Linux | [Planned] | Community plugins; partial HLS |
| Windows | [Planned] | Community plugins; partial HLS |
| Web | [Planned] | HTML5 video; HLS via polyfill on non-Safari |

Currently, no platform directories exist (`ios/`, `android/`, `macos/`, `linux/`, `windows/`, `web/`). They land in MVP ticket T-001. See [Wiki: Getting Started](https://github.com/nself-org/ntv/wiki/Getting-Started).

## Prerequisites

- **Flutter 3.10+** — install: [flutter.dev/install](https://docs.flutter.dev/get-started/install)
- **Dart 3.0+** — installed with Flutter.
- **nSelf CLI** (latest stable) — install: [nself-org/cli](https://github.com/nself-org/cli/wiki/Installation)
- **A self-hosted nSelf backend** with the **nTV plugin bundle** ($0.99/mo).

## Required nTV Plugins

| Plugin | Tier | Purpose |
|--------|------|---------|
| `media-processing` | Pro | Encoding pipeline |
| `streaming` | Pro | Adaptive bitrate streaming |
| `epg` | Pro | Electronic program guide |
| `tmdb` | Pro | Movie / TV metadata |
| `torrent-manager` | Free | Bundled companion |
| `content-acquisition` | Free | Bundled companion |
| `stream-gateway` | Pro [?] | Pending user verification per F06 |
| `podcast` | Pro [?] | Pending user verification per F06 |

Source: F06-BUNDLE-INVENTORY (in PPI SPORT directory).

## Roadmap

Phase 0 (Bootstrap) → Phase 1 (MVP Player on macOS) → Phase 2 (Library + Search) → Phase 3 (multi-platform) → Phase 4 (Sync) → Phase 5 (Casting + Offline + EPG) → Phase 6 (Cloud MAX integration).

Full plan: [Wiki: Architecture](https://github.com/nself-org/ntv/wiki/Architecture) and the in-repo `.claude/docs/ROADMAP.md` (gitignored, read locally).

## Documentation

- [Wiki: Getting Started](https://github.com/nself-org/ntv/wiki/Getting-Started)
- [Wiki: Backend Setup](https://github.com/nself-org/ntv/wiki/Backend-Setup)
- [Wiki: Architecture](https://github.com/nself-org/ntv/wiki/Architecture)
- [Wiki: Contributing](https://github.com/nself-org/ntv/wiki/Contributing)
- [Wiki: Player](https://github.com/nself-org/ntv/wiki/Feature-Player) | [Library](https://github.com/nself-org/ntv/wiki/Feature-Library) | [Search](https://github.com/nself-org/ntv/wiki/Feature-Search) | [Settings](https://github.com/nself-org/ntv/wiki/Feature-Settings) | [Sync](https://github.com/nself-org/ntv/wiki/Feature-Sync)

## Contributing

See [CONTRIBUTING](https://github.com/nself-org/ntv/wiki/Contributing). The repo is in bootstrap; expect frequent breaking changes until v0.5.

## Related Repos

- [cli](https://github.com/nself-org/cli) — the nSelf CLI that runs the user's backend
- [plugins](https://github.com/nself-org/plugins) — free plugins (`torrent-manager`, `content-acquisition` for nTV)
- [plugins-pro](https://github.com/nself-org/plugins-pro) — paid plugins including the nTV bundle
