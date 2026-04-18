# Settings

**Status:** Active

## Overview

The Settings screen is where the user configures everything about their nTV install: which backend to talk to, which account to use, how playback should behave by default, how the UI should look, and what to do about edge cases like background play and casting.

Settings persist locally per device. The backend URL and JWT live in `flutter_secure_storage`. Non-secret prefs (theme, default quality) live in `shared_preferences`. The same backend account can be reused across devices, and per-device prefs do not sync — the account does (see [[Feature-Sync]] for the parts that DO sync).

## Requirements

| Item | Required | Notes |
|------|----------|-------|
| nSelf CLI | latest stable | F01-MASTER-VERSIONS |
| Backend reachable from the device | Yes | Local LAN or remote |
| nSelf account | Yes | Email/password against backend Auth |
| Plugin: any nMedia plugin | Yes (for the screen to be useful) | Pro — F06 nMedia bundle |
| Tier | Bundle: nMedia ($0.99/mo per F06) | per F07-PRICING-TIERS |
| Bundle | nMedia | per F06-BUNDLE-INVENTORY |

## Configuration

The Settings screen itself IS the configuration. It exposes:

| Setting | Domain | Default | Notes |
|---------|--------|---------|-------|
| Backend URL | Connection | none | Required on first launch |
| Account email | Account | none | From login |
| JWT | Account (read-only) | issued | Hidden detail; logout clears |
| Theme | UI | System | Light / Dark / System |
| Default quality | Playback | Auto | Auto / 1080p / 720p / 480p |
| Hardware decode | Playback | Off | Off until validated per platform |
| Default subtitle language | Playback | Off | Off / per-language |
| Background play | Playback | Off | Per-platform, opt-in |
| Default cast device | Casting | none | Auto-discover Chromecast / AirPlay |
| Search provider | Search | Auto | Auto / Postgres / Meilisearch |
| Show watched indicator | Library | On | On / Off |
| Allow crash reporting | Privacy | Off | Off by default |

## Usage

### First-run setup

On first launch, app opens Settings → Connection. User enters backend URL, then login credentials. App stores the JWT and routes to Library.

### Switch backend

Settings → Connection → tap "Switch backend". App logs out of the current backend, returns to first-run flow.

### Change theme

Settings → Appearance → choose Light / Dark / System. Applies immediately.

### Reset

Settings → Advanced → Reset (planned). Wipes all local state. Requires re-setup.

## Limitations

- Settings do NOT sync across devices in MVP — each device configures itself. (Account-level state DOES sync via [[Feature-Sync]].)
- No multi-backend support in MVP — one backend per app instance.
- No per-user playback profiles in MVP — one set of prefs per device.

### Known issues

None tracked yet.

## Troubleshooting

### "Backend URL invalid"

**Symptom:** Saving the URL fails with a validation error.
**Cause:** URL must be a full `https://` (or `http://` for local), no trailing path.
**Fix:** Use `https://my-backend.example.com` or `http://localhost`.

### "Login failed: invalid credentials"

**Symptom:** Login returns a 401.
**Cause:** Email/password mismatch, OR the backend Auth service is not running.
**Fix:** Confirm credentials in the backend admin. Check `nself ls` shows `auth` running.

### Theme does not switch immediately

**Symptom:** Choosing Dark does not immediately switch the UI.
**Cause:** Riverpod provider not invalidating on settings change.
**Fix:** Restart the app for now. File an issue if persistent.

## Related

- [[Feature-Player]] — feature page (playback prefs)
- [[Feature-Sync]] — feature page (what does sync)
- [[Backend-Setup]] — backend bootstrap
- [[Getting-Started]] — first-run flow

← [[Home]]
