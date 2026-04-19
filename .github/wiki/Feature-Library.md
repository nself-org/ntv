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

## Implementation Detail

### Layout

The Library screen is a scrollable `CustomScrollView` with three sections:

1. **Genre filter chips** — horizontal scrollable row. Chips for each genre returned by `/streaming/genres`. An "All" chip clears the filter.
2. **Continue Watching** — horizontal card row showing items with saved progress. Only appears when there are in-progress items. Cards are 120px wide.
3. **Library grid** — `SliverGrid` with `maxCrossAxisExtent: 180` and `childAspectRatio: 0.65`. Each card shows a poster image and title (2-line max).

### Genre Filtering

The selected genre is held in `selectedGenreProvider` (a `StateProvider<String?>`). When a genre chip is selected, the provider updates and `libraryProvider` re-fetches with `?genre=<selected>`. The "All" chip sets the provider back to `null`.

### Search

The `AppBar` has a search icon that toggles an inline `TextField`. Submitting the search sets `searchQueryProvider`. The `searchResultsProvider` fetches `/streaming/library?q=<query>` and renders a grid replacing the main library view while searching.

Clearing the search (tap the X icon) resets both providers and returns to the genre-filtered library view.

### Continue Watching

`continueWatchingProvider` fetches `GET /streaming/continue`. Items are displayed in a horizontal `ListView` with 180px card height. Tapping an item goes to the detail screen, then tapping Play resumes from the saved position.

Continue-watching items are only shown if the list is non-empty. If the backend does not have the `streaming` plugin (and thus no `/streaming/continue` endpoint), the row is silently omitted.

### Pull-to-Refresh

Wrapping the `CustomScrollView` with `RefreshIndicator` enables pull-to-refresh. On refresh, both `libraryProvider` and `continueWatchingProvider` are invalidated via `ref.invalidate()`, triggering a full re-fetch.

### Unconfigured State

When no backend URL is set in Settings, `ApiService.isConfigured` returns `false`. All providers return empty lists immediately. The Library screen shows a centered prompt with a "Configure Backend" button that navigates to `/settings`.

### Poster Images

Poster URLs come from the `poster_url` or `poster_path` field in the `/streaming/library` response (populated by the `tmdb` plugin). Missing posters show a grey placeholder with an `Icons.movie` icon. Images load with `Image.network` and have an `errorBuilder` fallback in case the URL is unreachable.

## Related

- [[Feature-Search]] — feature page
- [[Feature-Player]] — feature page
- [[Feature-Sync]] — feature page (watch state)
- [[Backend-Setup]] — install the nTV bundle

← [[Home]]
