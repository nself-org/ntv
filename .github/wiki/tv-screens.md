# nTV TV Screens — Apple TV / Android TV

> **Platform:** react-native-tvos 0.76.x · tvOS + Android TV  
> **T-P3-E4-W2-S5-T04** — Favorites, Settings, TV Home

---

## Overview

The nTV Apple TV and Android TV app surfaces four top-level screens/panels:

| Screen / Panel | File | Purpose |
|---|---|---|
| Home | `src/screens/HomeScreen.tsx` | Featured + recently-watched channel grid |
| Player | `screens/PlayerScreen.tsx` | Full-screen HLS/DASH player with controls overlay |
| Channel List + EPG | `components/ChannelListPanel.tsx` / `components/EPGPanel.tsx` | Slide-in channel browser + program guide (T03) |
| Favorites | `src/components/FavoritesPanel.tsx` | Slide-in list of favorited channels |
| Settings | `src/components/SettingsPanel.tsx` | Nested settings: sources, player, about |

All paths relative to `ntv/platforms/appletv/`.

---

## TV UX Conventions

All interactive elements follow these rules (enforced in every screen/panel):

- **No touch events** — `onPress` only, never `onSwipe`/`panResponder`.
- **`hasTVPreferredFocus`** on the first focusable element so the Siri Remote or D-pad cursor starts at a known position.
- **`TVFocusGuideView`** wraps horizontal and vertical scroll regions to prevent focus getting stuck.
- **Text ≥ 24pt** everywhere (WCAG-equivalent at 3 m viewing distance).
- **Contrast ≥ 6:1** — background `#030712` (gray-950) base; key text `#f1f5f9` (slate-100) gives 18:1.
- **"menu" remote button** — never intercepted at root (system navigates back); intercepted inside open panels to close them.

---

## HomeScreen

Location: `src/screens/HomeScreen.tsx`

Two-row home grid rendered on launch:

1. **Featured row** — curated channel list. First cell has `hasTVPreferredFocus`.
2. **Recently Watched row** — ordered most-recent first; shows "No recently watched channels yet" when empty.

```
┌─────────────────────────────────────────┐
│  nTV                                     │
│                                          │
│  Featured                                │
│  [Cell] [Cell] [Cell] [Cell] [Cell] …   │
│                                          │
│  Recently Watched                        │
│  [Cell] [Cell] [Cell] …                 │
└─────────────────────────────────────────┘
```

Each `TVFocusGuideView` wraps a row so D-pad up/down crosses rows cleanly.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `featuredChannels` | `TVChannel[]` | placeholder 5 | Curated channels |
| `recentChannels` | `TVChannel[]` | placeholder 3 | Recently watched |
| `onPlayChannel` | `(ch: TVChannel) => void` | — | Called on channel select |

---

## FavoritesPanel

Location: `src/components/FavoritesPanel.tsx`

Slide-in overlay from the right edge. Shows the user's favorited channels.

- Opens via `visible={true}` prop (wired to remote event in the screen that hosts it).
- Vertical `FlatList` — D-pad up/down navigates rows; "select" plays the channel.
- "menu" remote button fires `onClose`.
- `TVFocusGuideView` with `trapFocusDown` + `trapFocusUp` — focus cannot escape the panel while it is open.

```
                              ┌──────────────┐
                              │ Favorites    │
                              │              │
                              │ ◉ News HD  ▶ │
                              │   Sports 1 ▶ │
                              │   Movies   ▶ │
                              │              │
                              │ Press menu   │
                              │ to close     │
                              └──────────────┘
```

### Props

| Prop | Type | Description |
|---|---|---|
| `visible` | `boolean` | Open/close state |
| `channels` | `TVChannel[]` | Favorited channels |
| `onPlayChannel` | `(ch: TVChannel) => void` | Plays selected channel |
| `onClose` | `() => void` | Closes the panel |

---

## SettingsPanel

Location: `src/components/SettingsPanel.tsx`

Slide-in settings panel with nested TV-focus menu navigation.

### Menu hierarchy

```
Settings (root)
├── Sources
│   ├── [list of M3U URLs]
│   └── Add M3U Source → TextInput (TV soft keyboard)
├── Player
│   └── (placeholder for player preferences)
└── About
    └── App version · Platform · License
```

### Navigation

- D-pad selects menu items.
- "menu" navigates back one level; at root → closes the panel.
- `TextInput` on TV: the on-screen keyboard appears automatically when the input receives focus.

### M3U Source management

1. User navigates: Settings → Sources → Add M3U Source.
2. A `TextInput` with `keyboardType="url"` receives focus.
3. TV on-screen keyboard opens automatically.
4. User types the M3U playlist URL and presses Done (or the "Save" button).
5. `onAddSource(url)` is called with the trimmed URL after HTTP/HTTPS validation.
6. Invalid URLs show an inline error without dismissing the keyboard.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `visible` | `boolean` | — | Open/close state |
| `m3uSources` | `string[]` | `[]` | Current M3U URLs |
| `onAddSource` | `(url: string) => void` | — | Called with new URL |
| `onRemoveSource` | `(url: string) => void` | — | Called with URL to remove |
| `onClose` | `() => void` | — | Closes the panel |

---

## Type Declarations

`src/types/react-native-tvos.d.ts` extends the `react-native` module with:

- `TVEventHandler` — class for attaching/removing remote event callbacks.
- `TVFocusGuideView` — component for constraining D-pad focus traversal.

These are react-native-tvos-only APIs absent from `@types/react-native`.

---

## Testing

**Apple TV Simulator (recommended):**

1. `pnpm tvos` — builds and launches on Apple TV simulator.
2. Use keyboard arrow keys (mapped to Siri Remote D-pad) to navigate.
3. Verify: Home loads with focus on first featured cell → D-pad right moves across cells → D-pad down enters Recently Watched row.
4. Open Favorites panel → D-pad navigates rows → "select" triggers play callback.
5. Open Settings panel → navigate Sources → Add source → type URL via soft keyboard → save.

**Android TV (D-pad physical device or emulator):**

Same flows as above — D-pad physically; "Back" button = "menu".
