# EPG — Electronic Program Guide

nTV includes a virtualized EPG grid displaying IPTV program schedules sourced from XMLTV data.

## Features

- Channel × time grid with FlashList vertical virtualization
- Time-proportional program tiles (1 min = 4 px)
- Current program highlighted per channel row
- Red time-marker line showing the current position in the timeline
- Timeline auto-scrolls to the current time on load
- Day tabs: Today / Tomorrow / Day +2
- Tap any program → detail modal (title, description, start/end time, duration)
- Record stub button in the detail modal (backend plugin required for full recording)

## Architecture

| File | Role |
|---|---|
| `app/(tabs)/epg.tsx` | EPG screen — day tabs, modal, data wiring |
| `components/EPGGrid.tsx` | Virtualized grid (FlashList + ScrollView) |
| `hooks/useEPG.ts` | GraphQL data fetcher (`np_epg_programs` + `np_epg_channels`) |

## Data Flow

1. `useEPG(channelIds, startTime, endTime)` queries Hasura via `@nself/graphql-client`.
2. GraphQL tables: `np_epg_channels`, `np_epg_programs` (populated by the XMLTV parser in T03).
3. Programs are indexed by `channelId` in a `Map` for O(1) lookup per row.

## Performance

- FlashList (not FlatList) is used for vertical channel row virtualization.
- Program tiles are memoized with `React.memo`.
- All row horizontal ScrollViews are driven by a single master ScrollView (zero-height, invisible) to keep scroll positions in sync without layout jank.
- Target: scroll FPS >50 on mid-range Android (measurable via FlashList Perf Monitor).

## GraphQL Operations

```graphql
query GetEPGPrograms(
  $channelIds: [String!]!
  $startTime: timestamptz!
  $endTime: timestamptz!
) {
  np_epg_channels(
    where: { id: { _in: $channelIds } }
    order_by: { order: asc }
  ) {
    id name logo_url order
  }
  np_epg_programs(
    where: {
      channel_id: { _in: $channelIds }
      start_time: { _lte: $endTime }
      end_time: { _gte: $startTime }
    }
    order_by: [{ channel_id: asc }, { start_time: asc }]
  ) {
    id channel_id title description start_time end_time duration_minutes
  }
}
```

## Out of Scope

- Recording backend (requires nTV bundle EPG plugin)
- Personal schedule reminders
- Push notifications for upcoming programs (separate ticket)
