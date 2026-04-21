# Search

**Status:** Active

## Overview

Search lets the user find a title across the full library by name, year, genre, or rating. Because the catalog can be very large, all queries are evaluated server-side — the app never holds the full list locally.

Underneath, search hits the same backend `streaming` schema as the Library, but with text-search predicates and additional filter joins (genre, year range, min rating). For text search, the backend may use Postgres `tsvector` directly or the optional `meilisearch` free plugin if installed for richer ranking.

## Requirements

| Item | Required | Notes |
|------|----------|-------|
| nSelf CLI | latest stable | F01-MASTER-VERSIONS |
| Plugin: `streaming` | Yes | Pro — F06 nTV bundle |
| Plugin: `tmdb` | Yes | Pro — F06 nTV bundle (provides searchable metadata) |
| Plugin: `meilisearch` | Optional | Free — improves ranking + typo tolerance |
| Tier | Bundle: nTV ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nTV | per F06-BUNDLE-INVENTORY |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `SEARCH_PROVIDER` | `postgres` | `postgres` (built-in) or `meilisearch` (if installed) |
| `MEILI_HOST` | none | Required if `SEARCH_PROVIDER=meilisearch` |
| `MEILI_MASTER_KEY` | none | Required if `SEARCH_PROVIDER=meilisearch` |

App-side (planned in Settings):

- Default search type (Title / Cast / Director)
- Show suggestions while typing (on / off)

## Usage

### Search by title

User opens the Search screen. Types into the input. Results stream in as the user types (debounced).

```dart
// Conceptual — actual code arrives in MVP T-007
final results = ref.watch(searchProvider(query));
```

### Filter results

Below the input, filter chips refine results by genre, year range, or minimum rating.

### Clear

Tap the X icon in the input to reset. The screen returns to the Recently Added view.

## Limitations

- No phonetic / fuzzy search without the `meilisearch` free plugin installed.
- No saved searches in MVP.
- No search-in-subtitles (planned post-v1.0).
- No autocomplete from the user's own watch history in MVP.

### Known issues

None tracked yet.

## Troubleshooting

### Search returns no results even for known titles

**Symptom:** Typing a title that exists in the Library returns zero results.
**Cause:** Backend search index is stale, or `meilisearch` is configured but down, or text search provider mismatch.
**Fix:** Run `nself plugin run media-processing reindex` on the backend. If using `meilisearch`, check it's running with `nself ls`.

### Search is slow

**Symptom:** Results take more than 2 seconds against a large catalog.
**Cause:** Postgres full-text search without an index, OR a missing GIN index.
**Fix:** Switch to the `meilisearch` provider, or run the optional index migration shipped with `streaming`.

### Filter chips do nothing

**Symptom:** Adding genre / year filters does not narrow the results.
**Cause:** Frontend bug or the metadata field is missing from the title (TMDB did not return it).
**Fix:** Confirm the metadata is set for at least one title via the backend admin. File an issue with reproduction.

## Related

- [[Feature-Library]] — feature page
- [[Feature-Settings]] — feature page (search prefs)
- [[Backend-Setup]] — install the nTV bundle

← [[Home]]
