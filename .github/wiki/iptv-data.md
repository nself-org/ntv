# ɳTV IPTV Data Layer

Covers M3U/XMLTV parsing, Xtream Codes API integration, channel list display, favorites, source management, and offline cache.

---

## Architecture

```
User adds M3U URL or Xtream credentials
        │
        ▼
useChannelList hook
  ├── fetchM3U(url) → parseM3U() → Channel[]
  ├── xtreamFullSync(creds) → Channel[]
  └── AsyncStorage cache (offline-first)
        │
        ▼
SectionList (channels.tsx)
  ├── Grouped by category/group-title
  ├── Search filter (client-side)
  └── Favorites (optimistic update → AsyncStorage)
```

---

## Files

| File | Purpose |
|------|---------|
| `services/m3u-parser.ts` | Pure TS M3U + XMLTV parser |
| `services/xtream.ts` | Xtream Codes API client |
| `hooks/useChannelList.ts` | Channel list state + async fetch + cache |
| `app/(tabs)/channels.tsx` | Channel list screen (SectionList + search + modal) |
| `assets/channel-placeholder.png` | Logo fallback image |

---

## Data Flow

### M3U Sources

1. User enters an M3U URL in the Add Source modal.
2. `addM3USource(url)` saves URL to `AsyncStorage` key `ntv:m3u:urls`.
3. `fetchM3U(url)` fetches the playlist via `fetch()` with 15s timeout.
4. `parseM3U(text)` extracts `Channel[]` from `#EXTINF` / `#EXTM3U` lines.
5. Merged channels saved to `ntv:channels:cache` with timestamp.
6. `SectionList` renders channels grouped by `group-title`.

### Xtream Sources

1. User enters server/username/password in the Add Source modal.
2. `xtreamAuthenticate()` validates credentials against `/player_api.php?action=authenticate`.
3. `xtreamGetLiveCategories()` + `xtreamGetLiveStreams()` fetched in parallel.
4. Each stream mapped to `Channel` with direct HLS URL: `{server}/live/{user}/{pass}/{streamId}.m3u8`.

### Offline Cache

- `AsyncStorage` key `ntv:channels:cache` stores last successful channel fetch with timestamp.
- On app start, cached channels are served immediately before network fetch completes.
- Cache TTL: 30 minutes (stale-while-revalidate — stale is still served, fresh fetch runs in background).
- Background sync (`BACKGROUND_SYNC_TASK`) re-fetches all sources while app is backgrounded via `expo-background-fetch`.

---

## Channel Type

```typescript
interface Channel {
  id: string;        // tvg-id or generated slug
  name: string;      // display name (after last comma in #EXTINF)
  url: string;       // direct stream URL (HLS/DASH/RTSP/MP4)
  logoUrl: string;   // tvg-logo attribute
  group: string;     // group-title attribute
  tvgId: string;     // raw tvg-id
  tvgName: string;   // tvg-name attribute
  sourceUrl?: string; // origin source URL
}
```

---

## M3U Parser — Edge Cases Handled

| Edge case | Handling |
|-----------|---------|
| UTF-8 BOM (U+FEFF) | Stripped before parse |
| Windows CRLF | Normalized to LF |
| Missing `#EXTM3U` header | Warning emitted, parse continues |
| URL without preceding `#EXTINF` | Added as unnamed channel with warning |
| Missing `tvg-id` | Slug generated from channel name + index |
| Quoted + unquoted attribute values | Both forms supported |
| Empty lines between entries | Skipped |
| Other `#EXT` directives (`#EXTVLCOPT`, `#EXTGRP`) | Skipped |

---

## Xtream API Endpoints Used

| Action | Endpoint |
|--------|---------|
| Authenticate | `/player_api.php?username=&password=&action=authenticate` |
| Live categories | `/player_api.php?...&action=get_live_categories` |
| Live streams | `/player_api.php?...&action=get_live_streams[&category_id=]` |
| Short EPG | `/player_api.php?...&action=get_short_epg&stream_id=&limit=` |
| Direct M3U export | `/get.php?...&type=m3u_plus&output=ts` |

---

## Favorites

- Stored in `AsyncStorage` key `ntv:channels:favorites` as JSON array of channel IDs.
- `toggleFavorite(channelId)` performs optimistic update: state updated immediately, async persist follows.
- Favorites section rendered first in the SectionList (above alphabetical groups).
- GraphQL `favorite_add` / `favorite_remove` mutations: stubbed — to be wired when `@nself/graphql-client` is configured (T-P3-E4).

---

## Background Sync

Register the sync task in your Expo entry point:

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { BACKGROUND_SYNC_TASK, runBackgroundChannelSync } from './hooks/useChannelList';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const result = await runBackgroundChannelSync();
  return result === 'new-data'
    ? BackgroundFetch.BackgroundFetchResult.NewData
    : BackgroundFetch.BackgroundFetchResult.NoData;
});

// Register on app start (once):
await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
  minimumInterval: 30 * 60, // 30 minutes
  stopOnTerminate: false,
  startOnBoot: true,
});
```

---

## Source Management

- M3U URLs stored under `ntv:m3u:urls` (AsyncStorage).
- Xtream credentials stored under `ntv:xtream:creds` (AsyncStorage — not encrypted; use `expo-secure-store` for production).
- `addM3USource` / `removeM3USource` / `addXtreamSource` / `removeXtreamSource` exposed from `useChannelList`.
- Full settings screen (add/edit/delete sources with list view) implemented in T06 (screens remaining).

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| M3U URL → channels in list within 5s | Implemented (`fetchM3U` + `parseM3U` + `SectionList`) |
| Xtream credentials → categories + channels | Implemented (`xtreamFullSync`) |
| Favorites heart tap → optimistic update | Implemented (`toggleFavorite` optimistic state) |
| Search filter → matching channels | Implemented (client-side filter in `buildSections`) |
| Offline → channels from cache | Implemented (AsyncStorage cache, served on mount) |
| Background sync → M3U re-parsed | Implemented (`runBackgroundChannelSync` + task def) |
