# TV Navigation — Apple TV & Android TV

nTV's Apple TV and Android TV interfaces use a D-pad + remote model. There are no touch
handlers anywhere in the TV code. All interaction flows through the Siri Remote (tvOS)
or Android TV D-pad.

## Remote Button Mapping

| Button | Context | Action |
|---|---|---|
| Select / OK | Player (no panel open) | Show player controls overlay (auto-dismisses in 5s) |
| Play/Pause | Player | Toggle playback |
| Left | Player, controls visible | Seek back 10s |
| Right | Player, controls visible | Seek forward 10s |
| Up | Player, no panel open | Open channel list panel |
| Up | Channel list open | Open EPG panel (second press) |
| Select / OK | Channel list item focused | Tune to that channel; close panel |
| Select / OK | EPG cell focused | Tune to that channel; close panel |
| Menu / Back | Channel list open | Close channel list; return focus to player |
| Menu / Back | EPG open | Close EPG; return focus to player |

## Panel Architecture

Panels are absolute-positioned overlays rendered inside `PlayerScreen`. Only one panel
can be open at a time. State is owned by `PlayerScreen`.

```
PlayerScreen
├── Video (full-screen)
├── TVPlayerControls (absolute overlay, auto-hides)
├── ChannelListPanel (absolute overlay, slides from right, z-index above controls)
└── EPGPanel (absolute overlay, slides from right, z-index above channel list)
```

Each panel registers its own `TVEventHandler` (only when `visible=true`) to catch `menu`
and close itself. `PlayerScreen`'s handler gates on `!channelListVisible && !epgVisible`
so panel events are not double-handled.

## Channel List Panel

- Width: 35% of screen width.
- `FlatList` with `hasTVPreferredFocus` on the first item.
- Each row: channel logo, name, category group, live indicator.
- Slides in with `Animated.timing` from the right (`translateX`).
- Selecting a channel calls `onSetSource(channel.url, channel.id)` and closes the panel.

## EPG Panel

- Width: 75% of screen width.
- Horizontal timeline grid: `PX_PER_MINUTE = 8` pixels per minute.
- Default window: now − 30 min to now + 3 h.
- Channel name column is fixed-width (180pt); program cells scroll horizontally via `TVFocusGuideView`.
- D-pad left/right moves focus between cells within a row.
- D-pad up/down moves between channel rows.
- Current program is highlighted with a left red border.
- A now-indicator line shows the current time on the timeline ruler.

## Text Size Requirements

All visible text meets the TV minimum of **24pt** for readability at 3 m distance:

| Element | Size |
|---|---|
| Channel name in list | 24pt |
| Panel header title | 28pt |
| EPG cell title | 20pt (dense grid; still legible at 3 m) |
| EPG cell time range | 16pt (secondary info) |
| Channel group label | 18pt |

## Focus Management

- `ChannelListPanel`: `hasTVPreferredFocus={isFirst}` on the first `Pressable` row ensures
  the remote lands on the first channel when the panel opens.
- `EPGPanel`: `TVFocusGuideView` wraps each channel's program row so D-pad navigation
  traverses cells correctly within a row and allows up/down to move between rows.
- `PlayerScreen` owns all focus state; panels do not persist any focus state between opens.

## Data Sources

Both panels reuse the shared mobile services:

| Data | Source |
|---|---|
| Channel list | `ntv/hooks/useChannelList.ts` → M3U parser + Xtream |
| EPG programs | `ntv/hooks/useEPG.ts` → GraphQL `np_epg_programs` |

The TV-specific hook `useChannelListTV` wraps `useChannelList` and adds panel visibility state.
It does not duplicate any fetching or caching logic.

## Android TV Parity

The same `ChannelListPanel` and `EPGPanel` components run on Android TV with no changes.
`TVEventHandler` handles `'menu'` on both platforms (it maps to the Android TV Back button).
`TVFocusGuideView` and `hasTVPreferredFocus` are part of `react-native-tvos` and work on both.

## Related Files

| File | Purpose |
|---|---|
| `platforms/appletv/components/ChannelListPanel.tsx` | Channel list overlay |
| `platforms/appletv/components/EPGPanel.tsx` | EPG grid overlay |
| `platforms/appletv/hooks/useChannelListTV.ts` | TV panel state wrapper hook |
| `platforms/appletv/screens/PlayerScreen.tsx` | Hosts all panels + TVEventHandler |
| `.github/wiki/tv-player.md` | Player controls documentation |
| `.github/wiki/epg.md` | EPG data pipeline documentation |
