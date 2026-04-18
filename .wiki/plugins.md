# Plugins

nTV uses the nTV plugin bundle on the nSelf backend. This page lists every plugin, what it provides to the app, and how to install it.

---

## Install Command

```bash
# From inside ntv/.backend/
nself license set nself_pro_xxxxx...

# Core plugins (required for library + streaming)
nself plugin install streaming stream-gateway epg tmdb

# Free plugins (no license key needed)
nself plugin install torrent-manager content-acquisition subtitle-manager

# Optional paid plugins
nself plugin install media-processing recording
```

Then rebuild and restart:

```bash
nself build
nself start
```

---

## Plugin Table

### nTV Bundle — Paid Plugins ($0.99/mo for bundle)

| Plugin | What It Provides to nTV | Tier |
|--------|------------------------|------|
| `streaming` | `/streaming/library`, `/streaming/play`, `/streaming/continue`, `/streaming/progress`, `/streaming/genres` endpoints. Serves HLS segments from transcoded files. | nTV bundle |
| `stream-gateway` | Stream URL routing. Returns the final playback URL with auth headers to the nTV client. Handles quality selection. | nTV bundle |
| `epg` | Electronic Program Guide data. Channel schedule lookup for IPTV channels by `tvg-id`. | nTV bundle |
| `tmdb` | Movie and TV metadata, poster art, backdrop images, cast, ratings. Populated via `/tmdb/movie/:id` and `/tmdb/tv/:id` endpoints. | nTV bundle |
| `media-processing` | Encoding pipeline. Transcodes uploaded or downloaded media into HLS-compatible formats. Written in Rust for encoding performance. | nTV bundle |
| `recording` | DVR-style recording from live streams. Recorded files appear in the library. | nTV bundle |

### Free Plugins (MIT, no license required)

| Plugin | What It Provides to nTV | Tier |
|--------|------------------------|------|
| `torrent-manager` | BitTorrent client. Downloads media files to the server's media directory for subsequent processing. | Free |
| `content-acquisition` | Automated content discovery and download orchestration. Schedules and queues media downloads. | Free |
| `subtitle-manager` | Subtitle search and download. Matches subtitle files to media items. Surfaces subtitle tracks in HLS manifests where supported. | Free |

---

## Minimum Viable Backend

For a working library + player setup, you need at minimum:

```bash
nself plugin install streaming stream-gateway tmdb
```

EPG requires `epg`. Progress sync, continue-watching, and genre browsing require `streaming`. Poster art requires `tmdb`.

IPTV M3U playback works with zero plugins — it streams directly from the provider URL.

---

## Version Compatibility

All nTV plugins are versioned with the nSelf plugin ecosystem. The nTV app targets the plugin API contract described in [Architecture](architecture). If you run significantly older plugin versions, some endpoints may not exist or may return different shapes.

Check `nself plugin list` on your backend to see installed plugin versions.
