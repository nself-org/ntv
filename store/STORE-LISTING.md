# nTV — Store Listing

Version: 1.0.9
Bundle ID: com.nself.ntv
Marketing URL: https://ntv.nself.org

---

## App Name

nTV

---

## Short Description (Play Store, 80 chars max)

Self-hosted media player. Stream your library on iOS, Android, and more.

---

## Full Description (Play Store / App Store, 4000 chars max)

See `metadata/en-US/full_description.txt`

---

## Keywords (App Store, 100 chars max)

media player,IPTV,self-hosted,streaming,HLS,DASH,EPG,TMDB,subtitle,library

---

## Release Notes (v1.0.9)

See `metadata/en-US/release_notes.txt`

---

## URLs

| Field | Value |
|-------|-------|
| Support | https://nself.org/support |
| Privacy policy | https://nself.org/privacy |
| Marketing | https://ntv.nself.org |

---

## Categories

| Store | Primary | Secondary |
|-------|---------|-----------|
| App Store | Entertainment | Utilities |
| Google Play | Entertainment | |

---

## iOS App Store Specifics

| Field | Value |
|-------|-------|
| Age rating | 4+ |
| Content rights | User-supplied content only. nTV does not distribute, host, or provide any media. Users connect the app to their own IPTV sources and self-hosted servers. |
| In-app purchases | None in the app itself. The nMedia backend bundle ($0.99/mo) is a separate server-side subscription purchased at nself.org. |
| Encryption | Standard HTTPS/TLS for backend communication. Uses exempt encryption (standard SSL). |
| Supported devices | iPhone (iOS 15+), iPad (iPadOS 15+) |
| Supported orientations | Portrait, Landscape Left, Landscape Right (iPhone); all four orientations (iPad) |

---

## Google Play Specifics

| Field | Value |
|-------|-------|
| Content rating | Everyone |
| App category | Entertainment |
| Target audience | General (13+) |
| Ads | None |
| In-app purchases | None |
| Data safety | No personal data collected. No data shared with third parties. Network communication goes only to the user's own backend server. |

---

## Self-Hosted Nature — Important Notes

nTV is a client application only. It does not provide a streaming backend, content library, or media hosting of any kind.

To use nTV beyond free IPTV playback, users must:

1. Have a server running the nSelf CLI (free, open-source: github.com/nself-org/cli)
2. Install the nMedia plugin bundle on that server (`nself plugin install media-processing streaming epg tmdb`)
3. Configure nTV with the server address and authentication token

The app does not connect to any nSelf-operated backend by default. All data — library metadata, watch history, user accounts — lives on the user's own hardware.

---

## Platform Build Notes

| Platform | Min OS | Notes |
|----------|--------|-------|
| iOS | 15.0 | AVPlayer for HLS; NSAppTransportSecurity allows arbitrary loads for self-hosted HTTP backends |
| Android | 8.0 (API 26) | Requires INTERNET permission; ExoPlayer for HLS/DASH |
| macOS | 12.0 | AVPlayer; sandboxed build with outgoing network entitlement |
| Windows | Windows 10 | media_kit for video; no store cert required for sideload |
| Linux | Ubuntu 20.04+ | media_kit + libmpv; Flatpak packaging planned |
| Web | Modern browsers | HLS via hls.js; Safari has native HLS support |
