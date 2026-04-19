# nTV

> Open-source media player for your self-hosted content. Like Plex, but you own everything.

**Status:** Active

## Quick Start

```bash
nself plugin install media-processing streaming epg tmdb
flutter run
```

See [[Backend-Setup]] for backend bootstrap and [[Getting-Started]] for client setup.

## Contents

- [Getting Started](#getting-started)
- [Core Stack](#core-stack)
- [Features](#features)
- [Commands](#commands)
- [Configuration](#configuration)
- [Plugins](#plugins)
- [Guides](#guides)
- [Architecture](#architecture)
- [Security](#security)
- [Brand](#brand)
- [Contributing](#contributing)
- [Resources](#resources)

## Getting Started

- [[Getting-Started]] — install Flutter, prepare the backend, run the app

## Core Stack

nTV is a Flutter client. The stack lives on a user-hosted nSelf backend.

- **PostgreSQL**, **Hasura**, **Auth**, **Nginx** — required nSelf backend services
- **nTV plugin bundle** — the streaming brain (`media-processing`, `streaming`, `epg`, `tmdb` per F06)

See the [[Backend-Setup]] page for full plugin install steps. Source: F08-SERVICE-INVENTORY.

## Features

- [[Player]] — video playback (HLS / DASH)
- [[Library]] — browse, sort, filter
- [[Search]] — full-text + filters
- [[Settings]] — server URL, account, playback prefs
- [[Sync]] — cross-device resume + watchlist

Full master list: `.claude/docs/FEATURES.md` in the repo (gitignored — read locally).

## Commands

nTV is a client app — there are no nTV-specific CLI commands. Backend operations use the `nself` CLI (see [nself-org/cli](https://github.com/nself-org/cli/wiki) for command reference).

## Configuration

Backend URL + credentials are configured in the app's [[Settings]] screen on first launch. See [[Getting-Started]] for the configuration flow.

## Plugins

nTV depends on the **nTV plugin bundle** ($0.99/mo per F06). Required minimum:

| Plugin | Tier | Purpose |
|--------|------|---------|
| `media-processing` | Pro | Encoding pipeline |
| `streaming` | Pro | Adaptive bitrate streaming |
| `epg` | Pro | Electronic program guide |
| `tmdb` | Pro | Movie / TV metadata |
| `torrent-manager` | Free | Bundled companion |
| `content-acquisition` | Free | Bundled companion |
| `stream-gateway` | `[?]` | Pending user verification per F06 |
| `podcast` | `[?]` | Pending user verification per F06 |

Full bundle inventory: F06-BUNDLE-INVENTORY (in PPI SPORT directory).

## Guides

- [[Backend-Setup]] — set up the nSelf backend with the nTV bundle
- [[Contributing]] — contributor notes

## Architecture

- [[Architecture]] — public-facing architecture overview

Detailed architecture in `.claude/docs/ARCHITECTURE.md` (read locally).

## Security

nTV inherits the nSelf backend security model. Auth is handled by the nSelf Auth service (nHost). All API calls require a valid JWT. The backend services bind to `127.0.0.1` and are only accessible via Nginx. See the [[Backend-Setup]] page for TLS configuration notes.

## Brand

Display name is **nTV** (locked: lowercase n, uppercase TV — never `ɳTV`, `NTV`, or `Ntv`). System form is `ntv` (repo, package, code spans). See PPI brand spec.

## Contributing

- [[Contributing]] — early-stage contributor guide. The repo is in bootstrap; expect frequent breaking changes.

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

**Free use:** Add any IPTV M3U playlist in Settings and browse live channels immediately. No nSelf backend required, no license key needed. See [[Feature-IPTV]].

**Full library mode:** Self-host your media collection using nSelf CLI with the nTV plugin bundle ($0.99/mo). Unlocks library management, adaptive streaming, metadata, EPG, and progress sync. See [[Backend-Setup]].

## Resources

- **GitHub:** [nself-org/ntv](https://github.com/nself-org/ntv)
- **Issues:** [Report a bug](https://github.com/nself-org/ntv/issues)
- **License:** [MIT](https://github.com/nself-org/ntv/blob/main/LICENSE)
- **nself.org:** [nself.org](https://nself.org)
