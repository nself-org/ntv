# nTV Screen Inventory

All screens in the nTV React Native app (Expo Router). Last updated: 2026-06-16 (T06 — P3/E4/W2/S4).

## Tab screens (`app/(tabs)/`)

| Screen | File | Status | Description |
|--------|------|--------|-------------|
| Channels | `channels.tsx` | Shipped | Full channel list with group sections, search, favorites toggle |
| EPG | `epg.tsx` | Shipped | Electronic Programme Guide grid for current + upcoming programs |
| Player | `player.tsx` | Shipped | Video player with transport controls, quality picker, cast button |
| Favorites | `favorites.tsx` | Shipped | Favorited channels — FlashList, unfavorite action, tap to play |
| Search | `search.tsx` | Shipped | Real-time search across channel names and EPG program titles |
| Schedule | `schedule.tsx` | Shipped | Recording schedule list (UI-only; backend recording via plugin) |
| Settings | `settings.tsx` | Shipped | Source management (M3U/XTREAM), playback prefs, notifications, about |

## UI States

Every screen supports all 7 UI states:

1. **Loading** — initial spinner while data is fetched
2. **Error** — error icon + retry button when fetch fails (no cached data)
3. **Empty** — empty-state icon + explanatory text when list is genuinely empty
4. **Offline** — served from AsyncStorage cache when network is unavailable
5. **Partial** — data shown even if some sources failed (error banner optional)
6. **Refreshing** — pull-to-refresh spinner overlay on populated list
7. **Populated** — full list rendered via FlashList

## RTL Support

All screens use `I18nManager.isRTL` to reverse row-direction layouts. The `initializeI18n()` call in app root sets `I18nManager.forceRTL(true)` when the device locale is Arabic, Urdu, Hebrew, or Persian. Toggling RTL requires an app restart (React Native limitation).

## Accessibility

- Every interactive element carries `accessibilityRole` and `accessibilityLabel`
- Minimum touch target 44×44pt per WCAG 2.1 SC 2.5.5
- Color contrast ≥ 4.5:1 for all text on `#030712` background
- `hitSlop` set on small icon buttons

## Source management (Settings screen)

M3U sources and Xtream credentials are managed in the Settings tab. Sources are persisted to AsyncStorage via `useChannelList`. Adding an M3U URL triggers an immediate background fetch; the refreshed channel list appears in Channels and Favorites.

## Recording Schedule

The Schedule screen is UI-only in v1.2. It displays stub data (three pre-seeded entries) to validate the layout. When the nTV plugin's recording feature ships, the stub data is replaced by a `recording_schedules` GraphQL query. Schedule entries from EPG long-press will appear here automatically.
