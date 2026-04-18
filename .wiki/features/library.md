# Library

The Library screen is the main screen in nTV. It shows your media collection from the nSelf backend and provides genre filtering, search, and a continue-watching row.

**Requires:** nSelf backend with `streaming` and `tmdb` plugins installed.

---

## Layout

The Library screen is a scrollable `CustomScrollView` with three sections:

1. **Genre filter chips** — horizontal scrollable row. Chips for each genre returned by `/streaming/genres`. An "All" chip clears the filter.
2. **Continue Watching** — horizontal card row showing items with saved progress. Only appears when there are in-progress items. Cards are 120px wide.
3. **Library grid** — `SliverGrid` with `maxCrossAxisExtent: 180` and `childAspectRatio: 0.65`. Each card shows a poster image and title (2-line max).

---

## Genre Filtering

The selected genre is held in `selectedGenreProvider` (a `StateProvider<String?>`). When a genre chip is selected, the provider updates and `libraryProvider` re-fetches with `?genre=<selected>`. The "All" chip sets the provider back to `null`.

---

## Search

The `AppBar` has a search icon that toggles an inline `TextField`. Submitting the search sets `searchQueryProvider`. The `searchResultsProvider` fetches `/streaming/library?q=<query>` and renders a grid replacing the main library view while searching.

Clearing the search (tap the X icon) resets both providers and returns to the genre-filtered library view.

---

## Continue Watching

`continueWatchingProvider` fetches `GET /streaming/continue`. Items are displayed in a horizontal `ListView` with 180px card height. Tapping an item goes to the detail screen, then tapping Play resumes from the saved position.

Continue-watching items are only shown if the list is non-empty. If the backend does not have the `streaming` plugin (and thus no `/streaming/continue` endpoint), the row is silently omitted.

---

## Pull-to-Refresh

Wrapping the `CustomScrollView` with `RefreshIndicator` enables pull-to-refresh. On refresh, both `libraryProvider` and `continueWatchingProvider` are invalidated via `ref.invalidate()`, triggering a full re-fetch.

---

## Unconfigured State

When no backend URL is set in Settings, `ApiService.isConfigured` returns `false`. All providers return empty lists immediately. The Library screen shows a centered prompt with a "Configure Backend" button that navigates to `/settings`.

---

## Poster Images

Poster URLs come from the `poster_url` or `poster_path` field in the `/streaming/library` response (populated by the `tmdb` plugin). Missing posters show a grey placeholder with an `Icons.movie` icon. Images load with `Image.network` and have an `errorBuilder` fallback in case the URL is unreachable.
