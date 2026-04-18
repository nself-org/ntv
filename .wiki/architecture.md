# Architecture

nTV is a Flutter application targeting six platforms. This page describes the internal structure, dependency choices, backend contract, and data flow.

---

## State Management: Riverpod

nTV uses [Riverpod](https://riverpod.dev/) (v2) for all state management.

- `FutureProvider.family` handles async data fetches (library, media details, episodes, stream URLs).
- `StateProvider` holds simple synchronous state (selected genre filter, search query).
- `ChangeNotifierProvider` wraps `SettingsService` so settings changes propagate to all consumers.
- `Provider` exposes the `ApiService` singleton.

Riverpod's `ref.invalidate()` drives pull-to-refresh — invalidating a provider causes Riverpod to re-execute its fetch function on the next read.

---

## Routing: go_router

Routes are declared in `lib/main.dart` using [go_router](https://pub.dev/packages/go_router):

```
/               → HomeScreen (library + search)
/settings       → SettingsScreen (connection config, playback prefs)
/detail/:id     → DetailScreen (metadata, episode list, play button)
  ?type=movie   (default)
  ?type=tvShow
/player         → PlayerScreen (full-screen video)
  ?mediaId=<id>
```

`HomeScreen` and `SettingsScreen` share a `ShellRoute` which renders the `NavigationBar` shell. `DetailScreen` and `PlayerScreen` are pushed on top with no shell (full-screen experience).

---

## HTTP Client: Dio

[Dio](https://pub.dev/packages/dio) (v5) is the HTTP client. A singleton `ApiService` instance (provided via `apiServiceProvider`) holds the configured `Dio` instance with:

- `baseUrl` set to the user's backend URL from Settings
- `Authorization: Bearer <token>` header when an API key is saved
- 10-second connect timeout, 30-second receive timeout

The `ApiService.configure()` method is called on app init (from `SettingsService.init()`) and on every Settings save.

---

## Video Playback: video_player + chewie

nTV uses [`video_player`](https://pub.dev/packages/video_player) for platform video decoding and [`chewie`](https://pub.dev/packages/chewie) for the playback controls overlay.

**Platform decoders used by video_player:**

| Platform | Decoder |
|----------|--------|
| iOS | AVPlayer |
| macOS | AVPlayer |
| Android | ExoPlayer |
| Windows | platform video_player (libVLC-based) |
| Linux | platform video_player (libVLC-based) |
| Web | HTML5 `<video>` + HLS.js |

`VideoPlayerController.networkUrl()` receives the stream URL returned by the `stream-gateway` plugin on the nSelf backend. Auth headers (from `StreamInfo.headers`) are passed directly to the controller.

On `PlayerScreen` init, the app forces landscape orientation via `SystemChrome.setPreferredOrientations` and enables immersive mode. Orientation is restored on dispose.

---

## Backend API Contract

The nTV client talks to two surfaces on the nSelf backend:

### REST endpoints (nMedia plugins)

| Method | Path | Plugin | Returns |
|--------|------|--------|--------|
| GET | `/streaming/library` | `streaming` | `{items: Media[]}` with optional `?genre=` and `?q=` |
| GET | `/streaming/continue` | `streaming` | `{items: Media[]}` — items with saved progress |
| GET | `/streaming/play/:id` | `stream-gateway` | `{url, format, headers}` — playback URL |
| POST | `/streaming/progress` | `streaming` | Save `{media_id, position_seconds}` |
| GET | `/streaming/genres` | `streaming` | `{genres: string[]}` |
| GET | `/tmdb/movie/:id` | `tmdb` | Full media object with metadata |
| GET | `/tmdb/tv/:id` | `tmdb` | Full TV show object |
| GET | `/tmdb/tv/:id/season/:n` | `tmdb` | `{episodes: Episode[]}` |

### Authentication

Settings allows an optional API key / bearer token. When set, every request carries `Authorization: Bearer <key>`. For public self-hosted libraries, the key field can be left blank.

---

## Data Flow

```
User opens Library screen
        │
        ▼
libraryProvider (FutureProvider.family)
        │
        ▼
ApiService.getLibrary(genre?, query?)
        │  GET /streaming/library
        ▼
nSelf backend / streaming plugin
        │
        ▼
List<Media> → Riverpod caches result
        │
        ▼
HomeScreen renders poster grid
        │
User taps item
        ▼
DetailScreen — mediaDetailProvider fetches /tmdb/movie/:id
        │
User taps Play
        ▼
PlayerScreen — streamInfoProvider fetches /streaming/play/:id
        │
        ▼
VideoPlayerController.networkUrl(stream.url, headers: stream.headers)
        │
        ▼
Platform decoder (AVPlayer / ExoPlayer / HTML5)
        │
Progress listener fires every ~10s
        ▼
ApiService.saveProgress(mediaId, position) → POST /streaming/progress
```

---

## Settings Persistence

`SettingsService` wraps `SharedPreferences`. Keys:

| Key | Stores |
|-----|--------|
| `ntv_backend_url` | Backend base URL |
| `ntv_api_key` | Bearer token (stored locally, not sent anywhere except the configured backend) |
| `ntv_autoplay` | Autoplay next episode toggle |
| `ntv_preferred_quality` | `auto`, `1080p`, `720p`, or `480p` |
| `ntv_m3u_urls` | List of IPTV M3U playlist URLs |

`SettingsService.init()` must be called once at app start before any provider reads settings. In `main()`, this happens inside `ProviderScope`'s initialization.
