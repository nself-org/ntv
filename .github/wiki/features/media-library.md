# Media Library

The nTV media library scans your local media directories, enriches files with metadata from TMDB, and builds a searchable catalog with pgvector semantic similarity.

---

## Requirements

- nTV bundle ($0.99/mo) installed via `nself plugin install tmdb media-processing`
- TMDB API key (`TMDB_API_KEY` in `.env.dev`)

---

## Library Scan

Run a library scan to index your media:

```bash
nself claw --scan-library  # via CLI
# or use nTV app: Library → Scan Now
```

The scanner:

1. Walks all directories in `NTV_MEDIA_PATHS` (colon-separated list in `.env`).
2. Identifies video files by extension (`.mkv`, `.mp4`, `.avi`, `.m2ts`, `.ts`, etc.).
3. Extracts file metadata (duration, resolution, codec, bitrate) via FFprobe.
4. Identifies the title by filename pattern matching (strips year, quality tags, scene tags).
5. Fetches TMDB metadata for identified titles (poster, backdrop, overview, genres, cast, IMDB ID).
6. Generates a pgvector embedding from the TMDB overview for semantic similarity.
7. Stores everything in Postgres (`ntv_media_items`, `ntv_media_metadata`, `ntv_media_embeddings` tables).

---

## "More Like This"

Every media item has a pgvector embedding. The "More Like This" feature uses cosine similarity over the embedding column to find semantically similar titles:

```sql
SELECT title FROM ntv_media_items
ORDER BY embedding <=> $1 LIMIT 10;
```

This surfaces recommendations without requiring a recommendation engine — just Postgres + pgvector.

---

## Watch History

Watch progress is tracked per-user per-item in `ntv_watch_history`. The nTV player updates progress every 30 seconds. On resume, playback starts from the last position.

Watch history syncs across platforms when the `sync` plugin is installed (requires ClawDE+ bundle or custom sync configuration).

---

## EXIF (Photos)

Photo albums (nFamily bundle) use the same media scanning infrastructure but read EXIF data instead of video metadata. See nFamily photo-albums documentation.
