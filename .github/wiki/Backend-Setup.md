# Backend Setup

**Status:** Active. The nMedia bundle membership in F06-BUNDLE-INVENTORY contains items marked `[?]` pending user verification; this page reflects that state honestly.

By the end of this guide you will:

- Have an nSelf backend running with the nMedia plugin bundle installed.
- Be ready to point nTV at that backend per [[Getting-Started]].

## Prerequisites

- **nSelf CLI** (latest stable) — install: [nself-org/cli](https://github.com/nself-org/cli/wiki/Installation)
- **Docker Desktop** (or Docker Engine on Linux) — required by the nSelf stack.
- **An nSelf license key** with the nMedia bundle entitlement (`$0.99/mo` per F06).
- A directory you can dedicate to the stack (e.g., `~/stacks/my-ntv-backend`).

## Required nMedia Plugins

Per F06-BUNDLE-INVENTORY, the nMedia bundle is canonical for the plugins below. Items marked `[?]` await user verification.

| Plugin | Tier | Required for | Notes |
|--------|------|--------------|-------|
| `media-processing` | Pro | encoding pipeline | F06 — confirmed |
| `streaming` | Pro | adaptive bitrate streaming | F06 — confirmed |
| `epg` | Pro | electronic program guide | F06 — confirmed; only needed if you want live TV |
| `tmdb` | Pro | movie / TV metadata | F06 — confirmed |
| `torrent-manager` | Free | torrent client | F06 — confirmed (free, ships alongside bundle) |
| `content-acquisition` | Free | media downloading | F06 — confirmed (free, ships alongside bundle) |
| `stream-gateway` | Pro `[?]` | streaming proxy | F06 — pending user verification |
| `podcast` | Pro `[?]` | podcast support | F06 — pending user verification |

## Optional nMedia Plugins

These extend the experience but are not required:

| Plugin | Purpose | Notes |
|--------|---------|-------|
| `recording` | DVR for live TV | Pairs with `epg` |
| `subtitle-manager` | Auto subtitle search and sync | OpenSubtitles integration |
| `game-metadata` | Game library metadata (IGDB) | If using nTV for ROMs |
| `vpn` | VPN integration | For privacy-conscious downloading |

## Steps

### Step 1 — Initialize the stack

```bash
nself init my-ntv-backend
cd my-ntv-backend
```

This generates the base `.env`, `docker-compose.yml` skeleton, and nginx config. Source: nSelf CLI wiki.

### Step 2 — Set your license key

```bash
nself license set <your-nself-pro-key>
```

The CLI validates the key against `ping.nself.org/license/validate`. Without a valid key, Pro plugins refuse to install.

### Step 3 — Install the nMedia bundle

Required minimum (matches the table above):

```bash
nself plugin install media-processing streaming epg tmdb
```

Free companions (auto-install with the bundle in some flows; install explicitly if needed):

```bash
nself plugin install torrent-manager content-acquisition
```

Optional:

```bash
nself plugin install recording subtitle-manager
```

### Step 4 — Configure environment variables

Each plugin reads its own env vars. Reference: F09-ENV-VAR-INVENTORY (in PPI SPORT directory).

Common values:

```ini
# in .env
TMDB_API_KEY=<your-tmdb-key>
STREAMING_HLS_SEGMENT_DURATION=6
EPG_PROVIDER=xmltv
```

Each plugin's wiki page in [nself-org/plugins-pro wiki](https://github.com/nself-org/plugins-pro/wiki) lists its full env vars (planned).

### Step 5 — Build and start

```bash
nself build
nself start
```

Expected: Hasura, Postgres, Auth, Nginx, and all installed nMedia plugins come up. `nself ls` shows them green.

### Step 6 — Verify the schema

```bash
nself doctor
```

Confirms all plugins migrated their tables. nTV's first-run health check uses the same schema.

## Verification

```bash
curl https://localhost/v1/graphql -H "X-Hasura-Admin-Secret: <your-admin-secret>" \
  -d '{"query": "{ streaming_movies(limit: 1) { id title } }"}'
```

Expected: a JSON response (possibly empty array) — confirms the `streaming` plugin's schema is reachable.

## Troubleshooting

### "License invalid"

**Symptom:** `nself plugin install` reports the license is rejected.
**Cause:** Key is wrong, expired, or `ping.nself.org` is unreachable.
**Fix:** Verify the key in your nself.org account. Check `nself license status`.

### "Plugin missing schema"

**Symptom:** `nself doctor` reports a plugin's tables don't exist after build.
**Cause:** Migration was skipped or rolled back.
**Fix:** `nself db sync` to reapply pending migrations. If still failing, file an issue against the plugin.

### "nMedia bundle entitlement not granted"

**Symptom:** A specific Pro plugin from the bundle refuses to install.
**Cause:** Your tier doesn't include the nMedia bundle (you may be on Free / Basic without the bundle add-on).
**Fix:** Upgrade to a tier that includes nMedia (per F07-PRICING-TIERS) or add the bundle.

## Next Steps

- [[Getting-Started]] — install and configure nTV against this backend
- [[Architecture]] — how nTV talks to the backend
- [[Player]] — playback feature page

← [[Home]]
