# Library

**Status:** Active

## Overview

The Library is the browsing surface of nTV. It shows the user's media catalog — movies, TV shows, music (post-MVP), and live channels — in a paginated, sortable, filterable list.

The Library does not store data locally. It queries the backend `streaming` schema over Hasura GraphQL, paginating 50 items at a time. Metadata (titles, posters, genres, ratings) comes from the `tmdb` plugin which enriches what the user has on disk with TMDB API data.

Because the catalog can be large (10k+ titles for serious self-hosters), the design is server-paginated and server-sorted. Local filtering is intentionally limited.

## Requirements

| Item | Required | Notes |
|------|----------|-------|
| nSelf CLI | latest stable | F01-MASTER-VERSIONS |
| Plugin: `streaming` | Yes | Pro — F06 nTV bundle |
| Plugin: `tmdb` | Yes | Pro — F06 nTV bundle |
| Plugin: `media-processing` | Yes | Pro — F06 nTV bundle (provides on-disk scan) |
| Plugin: `game-metadata` | Optional | Pro — needed only if browsing games |
| Tier | Bundle: nTV ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nTV | per F06-BUNDLE-INVENTORY |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `TMDB_API_KEY` | none | User's TMDB API key (free) — enables metadata |
| `TMDB_LANGUAGE` | `en-US` | Locale for titles, descriptions, posters |
| `LIBRARY_SCAN_INTERVAL_HOURS` | `6` | Backend rescan cadence (`media-processing`) |

App-side (planned in Settings):

- Default sort order (Recently added / Title / Year / Rating)
- Default view (Grid / List)
- Show / hide unwatched indicator

## Usage

### Browse the library

User opens the app. After login, the Library screen is the home. Scrolling triggers next-page fetch.

```dart
// Conceptual — actual code arrives in MVP T-004
final library = ref.watch(libraryProvider);
```

### Sort and filter

Tap the sort menu to choose order. Tap filter chips to narrow by genre, year, or rating. All sorts and filters re-issue a server query.

### Re-scan the disk

The Library reflects what `media-processing` knows about. To force a backend rescan after adding new files:

```bash
nself plugin run media-processing scan
```

## Limitations

- No client-side search across all titles (use the [[Feature-Search]] screen instead).
- No offline browsing in MVP — opening the app without backend connectivity shows an empty state.
- Custom collections / playlists are not in MVP.
- Music browsing as a first-class type is post-MVP (per F-14).

### Known issues

None tracked yet.

## Troubleshooting

### Library is empty

**Symptom:** Library screen shows no titles.
**Cause:** Backend `media-processing` has not scanned the user's media root, OR `tmdb` did not return matches.
**Fix:** Run `nself plugin run media-processing scan` on the backend. Check the backend logs for `tmdb` errors (often a missing API key).

### Posters do not load

**Symptom:** Title rows show blank poster slots.
**Cause:** TMDB API key is missing or rate-limited.
**Fix:** Set `TMDB_API_KEY` in the backend `.env`, restart the `tmdb` plugin.

### Pagination stops too early

**Symptom:** Scrolling does not load more titles even though more exist.
**Cause:** Frontend bug or backend pagination cap.
**Fix:** Pull to refresh. If persistent, file an issue.

## Related

- [[Feature-Search]] — feature page
- [[Feature-Player]] — feature page
- [[Feature-Sync]] — feature page (watch state)
- [[Backend-Setup]] — install the nTV bundle

← [[Home]]
