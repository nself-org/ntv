/**
 * Purpose: TV-specific channel list state for nTV Apple TV / Android TV.
 *          Wraps the shared useChannelList hook (ntv/hooks/useChannelList.ts) and
 *          adds TV-panel visibility state, active-channel tracking, and a setSource
 *          dispatcher so ChannelListPanel can request a channel change.
 *
 * Inputs:
 *   - onSetSource: (url: string) => void — called when user selects a channel
 *
 * Outputs:
 *   - channelListVisible: boolean — whether the channel list panel is open
 *   - epgVisible: boolean — whether the EPG panel is open
 *   - openChannelList / closeChannelList / openEPG / closeEPG
 *   - { channels, sections, loading, error } from shared hook
 *   - activeChannelId: string | null — currently playing channel id
 *   - selectChannel: (channel: Channel) => void — plays channel + closes panel
 *
 * Constraints:
 *   - TV-only: no touch events; focus managed by ChannelListPanel.
 *   - Reuses shared useChannelList — does NOT duplicate M3U/cache logic.
 *   - 'menu' remote = Android TV 'back' — panels handle it internally via TVEventHandler.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS channel+EPG status (T-P3-E4-W2-S5-T03)
 */

import { useCallback, useState } from 'react';
import { useChannelList } from '../../../hooks/useChannelList';
import type { Channel } from '../../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseChannelListTVOptions = {
  /** Called when user picks a channel — used to update the player stream URL */
  onSetSource: (url: string, channelId: string) => void;
};

export type UseChannelListTVReturn = {
  // Panel visibility
  channelListVisible: boolean;
  epgVisible: boolean;
  openChannelList: () => void;
  closeChannelList: () => void;
  openEPG: () => void;
  closeEPG: () => void;
  // Channel data (from shared hook)
  channels: Channel[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  // Active state
  activeChannelId: string | null;
  /** Select a channel: calls onSetSource + closes all panels */
  selectChannel: (channel: Channel) => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * State machine for the TV channel-list + EPG panels.
 * Only one panel can be open at a time — opening EPG closes channel list and vice versa.
 */
export function useChannelListTV({
  onSetSource,
}: UseChannelListTVOptions): UseChannelListTVReturn {
  const { channels, loading, error, refresh } = useChannelList();

  const [channelListVisible, setChannelListVisible] = useState(false);
  const [epgVisible, setEPGVisible] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const openChannelList = useCallback(() => {
    setEPGVisible(false);
    setChannelListVisible(true);
  }, []);

  const closeChannelList = useCallback(() => {
    setChannelListVisible(false);
  }, []);

  const openEPG = useCallback(() => {
    setChannelListVisible(false);
    setEPGVisible(true);
  }, []);

  const closeEPG = useCallback(() => {
    setEPGVisible(false);
  }, []);

  const selectChannel = useCallback(
    (channel: Channel) => {
      setActiveChannelId(channel.id);
      onSetSource(channel.url, channel.id);
      // Close both panels
      setChannelListVisible(false);
      setEPGVisible(false);
    },
    [onSetSource],
  );

  return {
    channelListVisible,
    epgVisible,
    openChannelList,
    closeChannelList,
    openEPG,
    closeEPG,
    channels,
    loading,
    error,
    refresh,
    activeChannelId,
    selectChannel,
  };
}
