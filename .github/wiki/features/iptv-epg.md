# IPTV and EPG

nTV supports IPTV via M3U playlists and EPG via XMLTV format. Live TV channels appear alongside your local media library.

---

## Requirements

- nTV bundle: `nself plugin install epg streaming`
- An M3U playlist URL from your IPTV provider

---

## Adding an M3U Source

1. In the nTV app: **Settings → IPTV Sources → Add Source**
2. Paste your M3U URL (e.g., `http://provider.example.com/playlist.m3u`)
3. Set a display name and refresh interval (default: 24h)
4. Save. The `epg` plugin fetches and parses the M3U, creating channel records in Postgres.

Or via CLI:

```bash
nself config set NTV_IPTV_SOURCES="http://provider.example.com/playlist.m3u"
nself build && nself restart epg
```

---

## EPG Channel Guide

The 7-day EPG grid shows:

- Current program and next program for each channel
- Program title, description, start/end times
- Episode and season info (when available in XMLTV data)

EPG data sources:
- **XMLTV** — most IPTV providers include an XMLTV URL in their M3U (via `x-tvg-url` tag)
- **Schedules Direct** — US/Canada EPG data (requires `SCHEDULES_DIRECT_API_KEY`)

---

## Channel Categories

The `epg` plugin categorizes channels from the M3U `group-title` tag:

- News · Sports · Movies · Series · Kids · Entertainment · Music · Lifestyle · Regional

Channels appear in the nTV sidebar organized by category.

---

## Free M3U (Without nTV Bundle)

The nTV Flutter app loads any M3U playlist without the nTV bundle — this is the free IPTV player mode. You get:
- Live channel list from M3U
- HLS stream playback
- Basic channel switching

The nTV bundle adds:
- 7-day EPG grid
- DVR recording (`recording` plugin)
- Catch-up TV (where provider supports `timeshift`)
- Channel logo enrichment from TMDB
