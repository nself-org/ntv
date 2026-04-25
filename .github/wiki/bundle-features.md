# nTV Bundle Features

nTV is free. IPTV playback from any M3U source works with no account and no subscription.

The **nTV Bundle** ($0.99/mo) unlocks server-side features powered by the nTV plugin pack on your self-hosted nSelf backend.

## Free (no account required)

| Feature | Available |
|---|---|
| M3U playlist import (URL or file) | Yes |
| Channel browsing with search + group filter | Yes |
| HLS/MPEG-TS playback via media_kit | Yes |
| Favorites and watch history (local) | Yes |
| Subtitle import (SRT, VTT, ASS) | Yes |
| Background playback + lock screen controls | Yes |
| Chromecast + AirPlay | Yes |
| Dark/light/AMOLED theme | Yes |
| Settings export/import | Yes |

## nTV Bundle ($0.99/mo)

The bundle unlocks the following features. You must have a self-hosted nSelf backend with the nTV plugin bundle installed and an active nSelf account.

| Feature | Requires bundle | Plugins |
|---|---|---|
| **EPG (Electronic Program Guide)** | Yes | `epg` |
| 7-day program grid | Yes | `epg` |
| Now-playing + next-up overlay | Yes | `epg` |
| EPG background refresh | Yes | `epg` |
| **Cross-device sync** | Yes | `streaming` |
| Sync sources, favorites, history, settings | Yes | `streaming` |
| Conflict resolution (last-write-wins) | Yes | `streaming` |
| **Recording (DVR)** | Yes | `recording` |
| Schedule recordings | Yes | `recording` |
| Manage recordings library | Yes | `recording` |
| **TMDB metadata** | Yes | `tmdb` |
| Movie + TV show posters and descriptions | Yes | `tmdb` |
| **Media processing** | Yes | `media-processing` |
| Transcoding to compatible format | Yes | `media-processing` |
| Adaptive bitrate (ABR) | Yes | `streaming` |

## How to activate

1. Subscribe at [nself.org/bundles/ntv](https://nself.org/bundles/ntv).
2. Set your nSelf backend URL in nTV Settings.
3. Install the nTV plugins on your backend:

```bash
nself license set nself_pro_<your-key>
nself plugin install media-processing streaming epg tmdb recording
nself build && nself start
```

4. Sign in to nTV with your nSelf account. Bundle features unlock automatically.

## Guest mode

You can use nTV without any account. In guest mode:

- M3U playlists work with no backend.
- Favorites and watch history are stored locally on-device only.
- Bundle-gated screens show an upgrade CTA instead of content.
