# TV UI Guide — rn-tvos D-pad Navigation

## Overview

nTV ships a full 10-foot UI for Apple TV (tvOS), Android TV, and Fire TV via `react-native-tvos`. All interactive elements support D-pad navigation with visible focus rings. Touch targets are disabled on TV surfaces.

## Focus Rings

Every focusable element uses a 3 px yellow border (`#fbbf24`) when focused:

```tsx
const focused = state.focused as boolean;
style={focused ? { borderWidth: 3, borderColor: '#fbbf24' } : {}}
```

Font sizes are minimum 24 sp (EPG) or 28 sp (channel list / player controls) for legibility at 3 m.

## TV-Specific Props

`react-native-tvos` adds props to `Pressable` and `View` that are not in `@types/react-native`. Annotate with `@ts-ignore`:

```tsx
<Pressable
  // @ts-ignore — isTVSelectable is a react-native-tvos prop, absent in RN types
  isTVSelectable
  // @ts-ignore — hasTVPreferredFocus is a react-native-tvos prop, absent in RN types
  hasTVPreferredFocus={isFirstItem}
>
```

The `focused` property in the Pressable render-prop state callback is also a tvos addition. Use a typed `any` cast:

```tsx
{(s: any) => {
  const focused = s.focused as boolean;
  return <Text style={focused && styles.textFocused}>…</Text>;
}}
```

## TVFocusGuideView

`TVFocusGuideView` guides D-pad traversal between sections that are not adjacent in the layout tree. Import from `src/tv/tv-compat.ts` (never directly from `react-native`):

```tsx
import { TVFocusGuideView } from './tv-compat';

<TVFocusGuideView style={styles.section} autoFocus destinations={[]}>
  {/* focusable children */}
</TVFocusGuideView>
```

## TVEventHandler

Register a D-pad remote listener once per screen, clean up on unmount:

```tsx
import { TVEventHandler } from './tv-compat';

useEffect(() => {
  if (!Platform.isTV) return;
  const handler = new TVEventHandler();
  handler.enable(null, (_cmp, event) => {
    switch (event.eventType) {
      case 'select':    // OK / enter
      case 'playPause': // Siri remote play/pause
      case 'up':
      case 'down':
      case 'left':
      case 'right':
      case 'menu':      // tvOS Menu / Android Back
      case 'back':
        break;
    }
  });
  return () => handler.disable();
}, [deps]);
```

## Screen-by-Screen D-pad Map

### TVChannelList

| D-pad | Action |
|---|---|
| Up / Down | Move focus between channel rows |
| Select | Play selected channel |
| Right | Open player for current channel |
| Menu / Back | Exit list |

- First channel row: `hasTVPreferredFocus`
- All rows: `isTVSelectable`
- `TVFocusGuideView` wraps the FlatList to contain vertical navigation

### TVPlayerScreen

| D-pad | Action |
|---|---|
| Select / Play-Pause | Toggle play / pause |
| Left | Seek back 10 s |
| Right | Seek forward 10 s |
| Up | Slide in channel list panel |
| Down | Dismiss channel list panel |
| Menu / Back | Exit player (or dismiss channel list if open) |

- Controls overlay auto-dismisses after 5 s of inactivity
- Play/pause button has `hasTVPreferredFocus`

### TVEPGScreen

| D-pad | Action |
|---|---|
| Left / Right | Move between programme cells in a row |
| Up / Down | Move between channel rows (via TVFocusGuideView) |
| Select | Select programme / navigate to player |

- First programme of first channel: `hasTVPreferredFocus`
- Each channel row wrapped in `TVFocusGuideView` for cross-row traversal

## tv-compat.ts Shim

TV APIs are runtime additions by `react-native-tvos` not present in `@types/react-native`. `src/tv/tv-compat.ts` exports typed wrappers using `require()`:

```ts
const rn = require('react-native') as {
  TVFocusGuideView: React.ComponentType<TVFocusGuideViewProps>;
  TVEventHandler: TVEventHandlerConstructor;
};

export const TVFocusGuideView = rn.TVFocusGuideView ?? View;
export const TVEventHandler = rn.TVEventHandler ?? class { enable() {} disable() {} };
```

This falls back to `View` / no-op on phone/tablet where `Platform.isTV === false`.

## Platform Guard

Always guard TV-only code:

```tsx
if (!Platform.isTV) return;
```

TV screens live in `src/tv/` and are never imported by phone/tablet screens (`src/screens/`).
