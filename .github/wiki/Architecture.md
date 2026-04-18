# Architecture

**Status:** Active

## Overview

nTV is a Flutter client app that targets six platforms from one codebase: iOS, Android, macOS, Linux, Windows, and Web. The app does not contain a server. All data, all media, all metadata, and all auth state live on a user-hosted nSelf backend.

The backend runs the nTV plugin bundle. The plugins handle streaming, transcoding, EPG, and TMDB metadata. The app speaks Hasura GraphQL over HTTPS with a JWT.

## Components

### Flutter App (this repo)

- **State management:** `flutter_riverpod` 2.4+. One `AsyncNotifierProvider` per screen (per the patterns doc).
- **Navigation:** `go_router` 13.x. Declarative routes. Deep links work on web.
- **HTTP:** `dio` 5.x as a singleton. JWT injected via interceptor.
- **Player:** `chewie` 1.7+ wrapping `video_player` 2.8+.
- **Storage:** `flutter_secure_storage` for the JWT, `shared_preferences` for non-secrets.

### nSelf Backend (user-hosted)

- **PostgreSQL** — owns the media library schema.
- **Hasura GraphQL** — exposes the schema to the app with row-level permissions.
- **Auth (nHost)** — issues JWTs via email/password.
- **Nginx** — TLS termination + routing to plugin services.
- **nTV plugin bundle** — all streaming, transcoding, metadata. Required minimum per [[Backend-Setup]].

## Data Flow

### Library browse

1. App opens Library screen.
2. Riverpod provider issues a paginated GraphQL query against `streaming` schema.
3. Hasura applies row permissions and returns 50 titles.
4. Riverpod emits the data; ListView renders rows.
5. Scroll triggers next page.

### Playback

1. User taps a title. `go_router` navigates to `/play/:id`.
2. App queries the backend for the stream URL (HLS playlist).
3. `chewie` initializes `video_player` with the URL.
4. Playback progress posted back to the backend every 10 seconds for sync.

### First-run health check

1. App detects no JWT.
2. Settings screen prompts for backend URL + credentials.
3. Login succeeds; app stores JWT.
4. App pings backend for plugin presence (`streaming`, `tmdb`, `epg`). Missing plugins surface a clear error pointing to [[Backend-Setup]].

## Per-Platform Notes

| Platform | Renderer | HLS | DASH | Background play | Status |
|----------|----------|-----|------|-----------------|--------|
| iOS | AVPlayer | yes | yes | Info.plist `audio` | Active |
| Android | ExoPlayer | yes | yes | Foreground service | Active |
| macOS | AVPlayer | yes | yes | yes | Active |
| Linux | community plugin | partial | partial | TBD | Active |
| Windows | community plugin | partial | partial | TBD | Active |
| Web | HTML5 video / HLS.js | Safari native; others polyfilled | partial | n/a | Active |

## Plugin Extension Points

nTV extends through the backend. The user adds plugins to their nSelf stack and the app picks them up through schema introspection. Examples:

- Install `recording` (Pro) — DVR features unlock in EPG view
- Install `subtitle-manager` (Pro) — subtitle search becomes available in the Player
- Install `vpn` (Pro) — VPN status appears in Settings

The app does NOT modify the backend. Plugin install is the user's responsibility via the `nself` CLI.

## Out-of-Scope

- Multi-server federation (one backend per app instance for v1.0)
- Server-side trans-coding control from the app (use backend admin)
- Plugin install / uninstall from the app

## Source

- Internal architecture (full): `docs/ARCHITECTURE.md` in the AI context directory (gitignored)
- Backend setup: [[Backend-Setup]]
- Bundle membership: F06-BUNDLE-INVENTORY in PPI SPORT directory

## Next Steps

- [[Getting-Started]] — install + run
- [[Backend-Setup]] — backend bootstrap
- [[Player]] — feature page

← [[Home]]
