# M3U Playlist Setup Guide

## What is M3U?

M3U is a plain-text playlist format for IPTV streams. nTV reads standard M3U (`#EXTM3U`) files containing channel entries with metadata (name, group, logo) and an HLS/RTSP/DASH stream URL per entry.

## Supported Formats

| Format | Support | Notes |
|---|---|---|
| `#EXTM3U` / `#EXTINF` | Full | Standard M3U |
| `tvg-id`, `tvg-name`, `tvg-logo`, `group-title` | Full | Parsed as metadata |
| HLS (`.m3u8`) | Full | Primary format |
| RTSP (`rtsp://`) | Full | IP camera streams |
| DASH (`.mpd`) | Partial | Depends on codec |
| MP4 direct link | Full | Progressive download |
| Xtream-Codes API | Planned | v1.3+ |

## Adding an M3U Source

### From a URL

1. Open **Settings** in nTV.
2. Tap **Add M3U Source**.
3. Enter your M3U playlist URL (must start with `http://` or `https://`).
4. Tap **Save**. nTV downloads and parses the playlist in the background.

URL validation rules (enforced by `src/lib/validators.ts`):
- Must use `http://` or `https://` scheme.
- Must have a non-empty hostname.
- Must be a parseable URL.

### From a File

Not yet supported. File import is planned for v1.3+. Use a URL to a locally-hosted playlist (e.g. via a home server) as a workaround.

## M3U Entry Format

nTV parses the following `#EXTINF` attributes:

```
#EXTM3U
#EXTINF:-1 tvg-id="bbc1.uk" tvg-name="BBC One" tvg-logo="https://..." group-title="UK",BBC One HD
https://stream.example.com/bbc1/index.m3u8
```

| Attribute | Maps to | Required |
|---|---|---|
| `tvg-name` | `Channel.name` | No (falls back to display name) |
| `tvg-id` | `Channel.id` | No (generated if absent) |
| `tvg-logo` | `Channel.logoUrl` | No |
| `group-title` | `Channel.group` | No (default: "Other") |

## Error Handling

The parser skips malformed entries and continues. Errors are surfaced in the ChannelList screen:

| Error | Displayed state | Action |
|---|---|---|
| URL unreachable | Error state with retry | Check connectivity |
| Empty playlist | Empty state with CTA | Verify URL is correct |
| All entries malformed | Empty state with CTA | Check M3U format |
| Partial parse failure | Populated (valid entries only) | Check skipped entries in logs |

## URL Validation

`validateM3UUrl(url: string)` in `src/lib/validators.ts` returns:

```ts
type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };
```

Called before any network request. Rejects non-http(s) schemes, empty hostnames, and unparseable URLs.

## Caching

Parsed channel lists are cached in AsyncStorage under `ntv:channels:*` keys. The ChannelList screen shows cached data while refreshing (offline state). The cache is invalidated on manual refresh or after a configurable TTL (default: 6 hours, set in Settings).

## Torrent / Magnet Sources (Bundle Required)

nTV supports adding torrent/magnet links as media sources via **TorrentManagerScreen**. This feature requires the **nTV bundle** subscription.

Supported magnet format:

```
magnet:?xt=urn:btih:<40-char-hex-or-32-char-base32>&dn=<name>&...
```

Torrent URL validation (`validateTorrentUrl`) accepts:
- `magnet:?xt=urn:btih:<infohash>` (with valid btih hash)
- `http(s)://` URLs ending in `.torrent`

Bundle gate: adding a torrent without an active nTV bundle shows an upsell card and an alert.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "No channels available" after adding URL | M3U URL returns non-M3U content | Verify URL in browser |
| Channels show but won't play | Stream requires auth or geo-block | Check with provider |
| Logo images not loading | `tvg-logo` URL is invalid or CORS-blocked | Expected — nTV shows initials fallback |
| Group tabs missing | No `group-title` attribute in M3U | Add `group-title` attributes to your M3U |
| Channels disappear after app restart | AsyncStorage cleared | Check device storage; re-add source |
