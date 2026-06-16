/**
 * Purpose: Fetch and manage EPG (Electronic Program Guide) data for nTV.
 * Queries XMLTV program data via GraphQL (epg_programs) for a given channel set
 * and date range. Returns typed program/channel arrays + loading/error state.
 *
 * Inputs:
 *   - channelIds: string[] — channel IDs to fetch programs for
 *   - startTime: Date — window start (inclusive)
 *   - endTime: Date — window end (inclusive)
 *
 * Outputs:
 *   - { programs, channels, loading, error, refetch }
 *
 * Constraints:
 *   - Data is sourced from T03 XMLTV parse output via GraphQL.
 *   - No local filtering — all filtering done server-side via query variables.
 *   - Re-fetches when channelIds, startTime, or endTime change.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG feature status updated
 */

import { useCallback, useEffect, useState } from 'react';
import { NselfGraphqlClient, HASURA_GRAPHQL_URL } from '@nself/graphql-client';

// Shared client instance for EPG queries (unauthenticated — EPG data is public)
const _epgClient = NselfGraphqlClient({ url: HASURA_GRAPHQL_URL });

/** Minimal urql-compatible query helper — returns data or throws. */
async function _query(
  queryStr: string,
  variables: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await _epgClient.query(queryStr, variables).toPromise();
  if (result.error) throw result.error;
  return (result.data ?? {}) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EPGChannel = {
  id: string;
  name: string;
  /** URL for the channel logo image */
  logoUrl: string | null;
  /** Display order in the EPG grid */
  order: number;
};

export type EPGProgram = {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  /** ISO 8601 string */
  startTime: string;
  /** ISO 8601 string */
  endTime: string;
  /** Duration in minutes */
  durationMinutes: number;
};

export type UseEPGReturn = {
  channels: EPGChannel[];
  programs: EPGProgram[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const EPG_QUERY = `
  query GetEPGPrograms(
    $channelIds: [String!]!
    $startTime: timestamptz!
    $endTime: timestamptz!
  ) {
    np_epg_channels(
      where: { id: { _in: $channelIds } }
      order_by: { order: asc }
    ) {
      id
      name
      logo_url
      order
    }
    np_epg_programs(
      where: {
        channel_id: { _in: $channelIds }
        start_time: { _lte: $endTime }
        end_time: { _gte: $startTime }
      }
      order_by: [{ channel_id: asc }, { start_time: asc }]
    ) {
      id
      channel_id
      title
      description
      start_time
      end_time
      duration_minutes
    }
  }
`;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEPG(
  channelIds: string[],
  startTime: Date,
  endTime: Date,
): UseEPGReturn {

  const [channels, setChannels] = useState<EPGChannel[]>([]);
  const [programs, setPrograms] = useState<EPGProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (channelIds.length === 0) {
      setLoading(false);
      setChannels([]);
      setPrograms([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    _query(EPG_QUERY, {
      channelIds,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    })
      .then((data: Record<string, unknown>) => {
        if (cancelled) return;

        const rawChannels = (data.np_epg_channels as Array<{
          id: string;
          name: string;
          logo_url: string | null;
          order: number;
        }>) ?? [];

        const rawPrograms = (data.np_epg_programs as Array<{
          id: string;
          channel_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          duration_minutes: number;
        }>) ?? [];

        setChannels(
          rawChannels.map((c) => ({
            id: c.id,
            name: c.name,
            logoUrl: c.logo_url,
            order: c.order,
          })),
        );

        setPrograms(
          rawPrograms.map((p) => ({
            id: p.id,
            channelId: p.channel_id,
            title: p.title,
            description: p.description,
            startTime: p.start_time,
            endTime: p.end_time,
            durationMinutes: p.duration_minutes,
          })),
        );

        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // stable JSON key to avoid re-fetching on array reference churn
    channelIds.join(','),
    startTime.toISOString(),
    endTime.toISOString(),
    refreshKey,
  ]);

  return { channels, programs, loading, error, refetch };
}
