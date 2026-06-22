/**
 * Purpose: Section-builder helper for the ɳTV channel list — groups a flat Channel[]
 *          into ChannelSection[] for SectionList display.
 *          Extracted from useChannelList.ts to keep that file under 300 lines.
 *
 * Inputs:
 *   channels  — full flat channel list.
 *   favorites — Set of favorited channel IDs.
 *   search    — current search query (may be empty string).
 *
 * Outputs: ChannelSection[] with Favorites first (if any), then alphabetically sorted groups.
 *
 * Constraints:
 *   - Pure function — no side effects, no hooks, no async.
 *   - When searching, Favorites section is suppressed to avoid duplicate entries.
 *   - Channels with empty group go into "Other".
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv iptv-data feature
 */

import type { Channel } from '../services/m3u-parser';

export interface ChannelSection {
  /** Category / group name — used as SectionList section header */
  title: string;
  data: Channel[];
}

/**
 * Group a flat channel array into sections by group/category.
 * Favorites section is first if any favorites are present.
 * Ungrouped channels go into an "Other" section.
 *
 * Note: When searching, the Favorites section is hidden so results show only
 * category groups. This prevents the same channel appearing in both sections.
 */
export function buildSections(
  channels: Channel[],
  favorites: Set<string>,
  search: string,
): ChannelSection[] {
  const q = search.toLowerCase().trim();
  const filtered = q
    ? channels.filter(
        (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
      )
    : channels;

  const showFavoritesSection = q === '' && favorites.size > 0;
  const favoriteChannels = showFavoritesSection
    ? filtered.filter((c) => favorites.has(c.id))
    : [];

  const groupMap = new Map<string, Channel[]>();
  for (const ch of filtered) {
    if (showFavoritesSection && favorites.has(ch.id)) continue;
    const key = ch.group.trim() || 'Other';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(ch);
  }

  const sections: ChannelSection[] = [];
  if (favoriteChannels.length > 0) {
    sections.push({ title: 'Favorites', data: favoriteChannels });
  }
  const sortedGroups = [...groupMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const group of sortedGroups) {
    sections.push({ title: group, data: groupMap.get(group)! });
  }
  return sections;
}
