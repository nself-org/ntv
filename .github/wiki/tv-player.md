# nTV TV Player — Apple TV & Android TV

The nTV TV player is a full-screen react-native-video based player for tvOS (Apple TV) and Android TV / Fire TV. It replaces the previous Flutter tvOS extension.

## Architecture

| File | Role |
|---|---|
| `platforms/appletv/screens/PlayerScreen.tsx` | Top-level screen — mounts video + overlay, wires TVEventHandler |
| `platforms/appletv/components/TVPlayerControls.tsx` | Presentational overlay — controls, seek bar, channel info, error state |
| `platforms/appletv/hooks/useTVPlayer.ts` | State machine — playback state, controls, auto-dismiss timer |

## TV Player Behaviour

### Full-screen layout

The player occupies the entire screen with no safe-area padding. TV displays are full-bleed by design. `StyleSheet.absoluteFillObject` is applied to both the `Video` component and the controls overlay.

### Remote control mapping

| Remote event | Action |
|---|---|
| `select` | Show controls overlay (auto-dismisses after 5 s) |
| `playPause` | Toggle play / pause |
| `left` (when controls visible) | Seek back 10 s |
| `right` (when controls visible) | Seek forward 10 s |
| `up` | Channel up (calls `onChannelUp` prop) |
| `down` | Channel down (calls `onChannelDown` prop) |
| `menu` | System-handled — navigates back (not intercepted) |

Android TV D-pad maps to the same events via react-native-tvos.

### Controls overlay

- Triggered by `select` remote event.
- Auto-dismisses after **5 seconds** (reset on each show call).
- Contains: seek progress bar, play/pause button, channel up/down buttons.
- `hasTVPreferredFocus` is set on the play/pause button so the Siri Remote / D-pad focus lands there by default when controls appear.

### Channel info overlay

- Displayed in the **bottom-left** corner at all times during playback (independent of controls visibility).
- Shows `currentProgramTitle` from the EPG prop.
- Hidden when no program title is available.

### Error state

When the stream URL is unreachable or returns an error:

1. Error overlay covers the full screen.
2. `hasTVPreferredFocus` on the **Retry** button so pressing `select` retries immediately.
3. `retry()` resets state and restarts playback from position 0.

## Stream format support

- **HLS** (.m3u8) — primary format for live IPTV channels.
- **DASH** (.mpd) — supported via react-native-video v6.
- Quality selection is automatic (`automaticallyWaitsToMinimizeStalling`).

## TVEventHandler lifecycle

`TVEventHandler` is instantiated in a `useEffect` inside `PlayerScreen` with an empty dependency array. It is disabled (`tvEventHandler.disable()`) in the cleanup function, preventing double-registration when the user navigates away and back.

```tsx
useEffect(() => {
  const tvEventHandler = new TVEventHandler();
  tvEventHandler.enable(null, (_cmp, evt) => { /* ... */ });
  return () => { tvEventHandler.disable(); };
}, []);
```

## Props

### `PlayerScreen`

| Prop | Type | Required | Description |
|---|---|---|---|
| `streamUrl` | `string` | Yes | HLS or DASH stream URI |
| `currentProgramTitle` | `string` | No | Current program name from EPG |
| `onChannelUp` | `() => void` | No | Called on D-pad up |
| `onChannelDown` | `() => void` | No | Called on D-pad down |

### `TVPlayerControls`

See `TVPlayerControlsProps` in source — receives slices of `TVPlayerState` and `TVPlayerControls` from `useTVPlayer`.

## Development

```bash
# Apple TV simulator (tvOS)
cd ntv/platforms/appletv
pnpm install
npx react-native run-ios --scheme ntv-tvOS --simulator "Apple TV"

# Android TV emulator (API 29+)
npx react-native run-android --variant release
```

## Related tickets

- T-P3-E4-W2-S5-T01 — react-native-tvos scaffold
- T-P3-E4-W2-S5-T03 — channel list panel
- T-P3-E4-W2-S5-T04 — EPG panel
