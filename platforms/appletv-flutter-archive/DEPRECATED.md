# DEPRECATED — Flutter Apple TV Archive

**Status:** ARCHIVED — superseded by react-native-tvos  
**Archived:** 2026-06-16 (T-P3-E4-W2-S5-T01)  
**Superseded by:** `ntv/platforms/appletv/` (react-native-tvos)

---

## What This Was

This directory contains the original Flutter tvOS extension for nTV. It targeted tvOS 17+
via the Flutter tvOS platform support added in Flutter 3.13.

**Entry point:** `lib/main_tvos.dart`  
**Known limitations at archive time:**
- Focus traversal engine partial; D-pad nav may skip widgets
- `video_player` plugin lacks tvOS entitlements; mitigated by `media_kit`
- Remote swiping gesture mapping quirks
- Orientation lock required manual `SystemChrome` call on every rebuild

## Why Archived

Per TV Platform Decisions doc (T-P3-E4-W1-S2-T02 §2):

> React Native tvOS is the canonical TV platform per nSelf stack decisions. Flutter tvOS is
> experimental at v3.24; rn-tvos is mature and enables code-sharing with Android TV + iOS TV
> extensions. The current Flutter impl is minimal enough that a rewrite is lower-friction than
> patching focus engine gaps across future feature additions.

Decision: **REWRITE_RNTV** — migration to react-native-tvos is complete as of T-P3-E4-W2-S5-T07.

## Do Not Use

This archive is retained for historical reference only. **Do not restore or build from this directory.**

All new Apple TV and Android TV development belongs in `ntv/platforms/appletv/`.

## References

- Replacement: `ntv/platforms/appletv/` (react-native-tvos)
- Parity matrix: `ntv/platforms/appletv/tv-parity-matrix.md`
- TV Platform Decisions: T-P3-E4-W1-S2-T02 (`/.claude/docs/p3/e4-ntv-tv-platform-decisions.md`)
- SPORT: F12-REPO-TYPE-MAP.md — `ntv/platforms/appletv → rn-tvos (complete)`
