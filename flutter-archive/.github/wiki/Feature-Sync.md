# Sync

**Status:** Active

## Overview

Sync keeps a user's watch state — resume position, watchlist, watch history — consistent across all the devices they use nTV on. Start a movie on macOS, finish it on iPhone. Add a show to the watchlist on Web, see it on Android.

Sync is account-scoped. Per-device settings (theme, default quality) do NOT sync; account state (what you watched, where you stopped, what you saved) does.

The backing storage lives in the nSelf backend. The app posts updates over Hasura GraphQL mutations on the same JWT as the rest of the app.

## Requirements

| Item | Required | Notes |
|------|----------|-------|
| nSelf CLI | latest stable | F01-MASTER-VERSIONS |
| Plugin: `streaming` | Yes | Pro — F06 nTV bundle (provides watch-state schema) |
| nSelf account (logged in) | Yes | All sync rows are scoped per account |
| Multiple devices | Optional but pointless without | Sync makes no sense on a single-device install |
| Tier | Bundle: nTV ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nTV | per F06-BUNDLE-INVENTORY |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `SYNC_PROGRESS_INTERVAL_MS` | `10000` | App-side cadence for posting playback progress |
| `SYNC_HISTORY_RETENTION_DAYS` | `0` (forever) | Backend retention for watch history rows |

App-side (planned in Settings):

- Sync watch history (on / off — defaults on)
- Sync watchlist (on / off — defaults on)
- Sync resume position (on / off — defaults on)

## Usage

### Resume across devices

User watches 23 minutes of a movie on macOS. Closes the app. Opens nTV on iPhone. Taps the same movie. Player asks: "Resume from 23:00?" or "Start over?".

```dart
// Conceptual — actual code arrives in MVP T-011
final progress = await ref.read(syncRepoProvider).fetchProgress(movieId);
```

### Watchlist

User adds a show to the watchlist on Web. The next time the user opens nTV on any device, the show appears in the Watchlist tab.

### Disable sync for a single item (privacy)

User can mark an item as "private" (planned post-MVP). That item does not enter sync history.

## Limitations

- Multi-profile per account is post-MVP (per F-43). v1.0 sync is one profile per account.
- No conflict resolution UI — last writer wins.
- Sync is best-effort — if the backend is unreachable, the app falls back to local-only state and reconciles on next reach.
- Watch history retention is a backend setting; the user has limited app-side control in v1.0.

### Known issues

None tracked yet.

## Troubleshooting

### Resume position does not persist

**Symptom:** Closing the app and reopening loses the playback position.
**Cause:** App was offline; backend write failed; or sync is disabled in Settings.
**Fix:** Check Settings → Sync. Confirm backend is reachable. Look for a sync indicator in the app status bar (planned).

### Watchlist out of sync between devices

**Symptom:** Item added on one device does not appear on another.
**Cause:** The other device has a stale cache, or the backend mutation failed silently.
**Fix:** Pull-to-refresh on the Watchlist tab. If persistent, file an issue.

### "Sync paused — backend unreachable"

**Symptom:** Sync indicator shows paused.
**Cause:** Backend is unreachable from the current network.
**Fix:** Check VPN / network. Sync resumes automatically when connectivity returns.

## Related

- [[Feature-Player]] — feature page (resume integration)
- [[Feature-Library]] — feature page (watch state visible in Library)
- [[Feature-Settings]] — feature page (sync toggles)
- [[Backend-Setup]] — backend bootstrap

← [[Home]]
