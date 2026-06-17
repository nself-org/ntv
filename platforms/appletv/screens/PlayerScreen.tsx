/**
 * Purpose: Full-screen TV player screen for nTV Apple TV / Android TV.
 * Inputs: streamUrl — HLS/DASH URI; currentProgramTitle — from EPG (optional);
 *         channels — channel list for ChannelListPanel;
 *         epgChannels / epgPrograms — EPG data for EPGPanel;
 *         onSetSource — called when user selects a channel from the panel.
 * Outputs: Full-screen react-native-video + TVPlayerControls + ChannelListPanel + EPGPanel overlays.
 * Constraints:
 *   - TV-only: no safe-area padding, no touch handlers, no swipe gestures.
 *   - TVEventHandler wired here; cleaned up on unmount (prevents double-registration).
 *   - 'select' → show controls. 'playPause' → toggle play/pause.
 *   - 'left'/'right' → seek ±10s (only when controls visible and channel list closed).
 *   - 'up' → open channel list panel (when panels closed); second 'up' → EPG.
 *   - 'menu' → handled by panels first, then system (navigates back) — do not intercept here.
 *   - Player fills entire screen (0 margin/padding, full bleed).
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS player screen + channel+EPG panels (T-P3-E4-W2-S5-T02 / T03)
 */

import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import type { OnVideoErrorData } from 'react-native-video';
import { ChannelListPanel } from '../components/ChannelListPanel';
import { EPGPanel } from '../components/EPGPanel';
import { TVPlayerControls } from '../components/TVPlayerControls';
import { useTVPlayer, SEEK_STEP_SECONDS } from '../hooks/useTVPlayer';
import { useTVEventHandler } from '../src/hooks/useTVEventHandler';
import type { TVRemoteEvent } from '../src/hooks/useTVEventHandler';
import type { Channel } from '../../../services/m3u-parser';
import type { EPGChannel, EPGProgram } from '../../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlayerScreenProps = {
  /** HLS or DASH stream URI */
  streamUrl: string;
  /** Current program title from EPG — shown bottom-left */
  currentProgramTitle?: string;
  /** Channel list for the slide-in channel panel */
  channels?: Channel[];
  /** EPG channel metadata for the EPG panel */
  epgChannels?: EPGChannel[];
  /** EPG programs for the EPG panel */
  epgPrograms?: EPGProgram[];
  /** Called when user selects a different channel from the panel */
  onSetSource?: (url: string, channelId: string) => void;
  /** Actively playing channel id (highlights row in channel list) */
  activeChannelId?: string | null;
  /** Loading state for channel list */
  channelsLoading?: boolean;
  /** Loading state for EPG */
  epgLoading?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Full-screen TV player. Occupies 100% of the screen with no margin or padding.
 * TVEventHandler registered here (and only here) to avoid double-registration
 * when navigating away and back.
 *
 * Panel state machine:
 *   - 'up' from player → channel list opens
 *   - second 'up' from channel list (or ChannelListPanel.onOpenEPG) → EPG opens
 *   - 'menu' in any panel → panel closes, focus returns to player
 */
export function PlayerScreen({
  streamUrl,
  currentProgramTitle,
  channels = [],
  epgChannels = [],
  epgPrograms = [],
  onSetSource,
  activeChannelId = null,
  channelsLoading = false,
  epgLoading = false,
}: PlayerScreenProps) {
  const player = useTVPlayer(streamUrl);

  // Panel visibility state
  const [channelListVisible, setChannelListVisible] = useState(false);
  const [epgVisible, setEPGVisible] = useState(false);

  // Track controls visibility in a ref so the TVEventHandler callback
  // (stable reference) can check current state without re-registering.
  const controlsVisibleRef = useRef(player.controlsVisible);
  controlsVisibleRef.current = player.controlsVisible;

  // Track panel visibility in refs for TVEventHandler (avoids re-registering)
  const channelListVisibleRef = useRef(channelListVisible);
  channelListVisibleRef.current = channelListVisible;
  const epgVisibleRef = useRef(epgVisible);
  epgVisibleRef.current = epgVisible;

  // Panel open/close callbacks
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

  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      onSetSource?.(channel.url, channel.id);
      setChannelListVisible(false);
      setEPGVisible(false);
    },
    [onSetSource],
  );

  const handleSelectChannelFromEPG = useCallback(
    (channelId: string) => {
      const ch = channels.find((c) => c.id === channelId);
      if (ch) {
        onSetSource?.(ch.url, ch.id);
      }
      setEPGVisible(false);
    },
    [channels, onSetSource],
  );

  // Channel zap: move to the next/previous channel relative to the active one.
  // Wraps around the channel list. No-op when fewer than 2 channels exist.
  const zapChannel = useCallback(
    (direction: 1 | -1) => {
      if (channels.length < 2) return;
      const idx = channels.findIndex((c) => c.id === activeChannelId);
      const base = idx === -1 ? 0 : idx;
      const nextIdx = (base + direction + channels.length) % channels.length;
      const next = channels[nextIdx];
      if (next) onSetSource?.(next.url, next.id);
    },
    [channels, activeChannelId, onSetSource],
  );

  const channelUp = useCallback(() => zapChannel(1), [zapChannel]);
  const channelDown = useCallback(() => zapChannel(-1), [zapChannel]);

  // useTVEventHandler — registered once, cleaned up on unmount.
  // Only fires when NO panel is open (panels have their own TVEventHandler).
  useTVEventHandler(
    useCallback(
      (_cmp: null, evt: TVRemoteEvent) => {
        // If a panel is open, let the panel's own TVEventHandler handle events.
        if (channelListVisibleRef.current || epgVisibleRef.current) return;

        switch (evt.eventType) {
          case 'select':
            // Show controls (auto-dismisses after 5s)
            player.showControls();
            break;

          case 'playPause':
            player.togglePlayPause();
            break;

          case 'left':
            // Seek back 10s — only active when controls are visible
            if (controlsVisibleRef.current) {
              player.seekRelative(-SEEK_STEP_SECONDS);
            }
            break;

          case 'right':
            // Seek forward 10s — only active when controls are visible
            if (controlsVisibleRef.current) {
              player.seekRelative(SEEK_STEP_SECONDS);
            }
            break;

          case 'up':
            // 'up' from player → open channel list
            openChannelList();
            break;

          case 'down':
            // 'down' from player → zap to the previous channel
            channelDown();
            break;

          // 'menu' is not intercepted here — system handles.
          default:
            break;
        }
      },
      [player, openChannelList, channelDown],
    ),
  );

  return (
    // Full-bleed container — no margin, no padding, no safe-area insets on TV
    <View style={styles.container}>
      {/* react-native-video: covers entire screen */}
      <Video
        ref={player.videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        resizeMode="contain"
        // Playback control
        paused={!player.isPlaying}
        // react-native-video v6 callbacks
        onLoad={player.onVideoLoad}
        onBuffer={player.onVideoBuffer}
        onProgress={player.onVideoProgress}
        onError={(e: OnVideoErrorData) => player.onVideoError(e)}
        onEnd={player.onVideoEnd}
        // HLS/DASH: automatic quality selection
        automaticallyWaitsToMinimizeStalling
        // TV: disable Picture-in-Picture (TV IS the TV)
        allowsExternalPlayback={false}
        // Android TV: prevent screen from sleeping during playback
        disableFocus={false}
      />

      {/* Controls overlay: absolute positioned, full screen */}
      <TVPlayerControls
        uiState={player.uiState}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        buffered={player.buffered}
        controlsVisible={player.controlsVisible}
        errorMessage={player.errorMessage}
        currentProgramTitle={currentProgramTitle}
        togglePlayPause={player.togglePlayPause}
        retry={player.retry}
        onChannelUp={channelUp}
        onChannelDown={channelDown}
      />

      {/* Channel list panel: slides in from the right on 'up' from player */}
      <ChannelListPanel
        visible={channelListVisible}
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        onClose={closeChannelList}
        onOpenEPG={openEPG}
        loading={channelsLoading}
      />

      {/* EPG panel: slides in from the right on second 'up' (or ChannelListPanel trigger) */}
      <EPGPanel
        visible={epgVisible}
        channels={epgChannels}
        programs={epgPrograms}
        onClose={closeEPG}
        onSelectChannel={handleSelectChannelFromEPG}
        loading={epgLoading}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    // Explicitly zero out any platform-injected margin/padding
    margin: 0,
    padding: 0,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    // Full bleed — no padding, no margin, no safe area on TV
    margin: 0,
    padding: 0,
  },
});
