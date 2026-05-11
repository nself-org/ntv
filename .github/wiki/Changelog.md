# Changelog

All notable changes to nTV are documented in this file.

---

## v1.1.0 (PENDING — v1.1.0 ecosystem release)

Minor release. App store binary submissions (Roku, AppleTV, Android TV, Samsung, LG). nTV bundle updated to 12 plugins.

### Added

- **App store binaries**: First official binary submissions for Roku Channel Store, tvOS App Store (AppleTV), Android TV (Google Play), Samsung Tizen, and LG webOS platforms.
- **nTV bundle v1.1.0**: bundle now includes 12 plugins — stream-gateway, streaming, epg, tmdb, podcast, recording, game-metadata, file-processing, subtitle-manager, vpn, media-processing, and tokens (new). Plus auto-installed free companions: torrent-manager + content-acquisition.
- **`nself bundle install ntv` support**: users can now install all 12 nTV bundle plugins in one command.
- **Marketing site**: `ntv.nself.org` (web/ntv subdomain) launches at v1.1.0.
- **Multi-platform playback**: Roku and Samsung TV platform adapters added.

### Changed

- Minimum nSelf CLI version: v1.1.0.
- nTV bundle price reflected in in-app upgrade prompt: $0.99/mo / $9.99/yr.
- Plugin count: 12 (was 11; added `tokens` for secure content delivery).

---

## v1.0.12 (P96 — 2026-04-25)

### Added
- Flutter ship-ready: l10n ARB files generated for all supported locales.
- Brand assets updated to v1.0.12 icon set.
- Auth SDK migration: replaced direct Hasura auth calls with nSelf auth SDK client.

### Changed
- nTV bundle price reflected in in-app upgrade prompt: $0.99/mo.
- Minimum nSelf CLI version requirement bumped to v1.0.12.
