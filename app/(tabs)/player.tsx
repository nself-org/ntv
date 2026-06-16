/**
 * Purpose: nTV media player screen — react-native-video with HLS/DASH/MP4/RTSP.
 * Supports custom controls overlay, PiP (iOS/Android), background audio,
 * HLS quality selection, fullscreen landscape lock, and all 7 UI states.
 *
 * Inputs:
 *   - Expo Router searchParam `uri` — stream URL (string | undefined)
 *
 * Outputs:
 *   - Full-screen video player with PlayerControls overlay.
 *
 * Constraints:
 *   - No media state in this file — all logic in useMediaPlayer hook.
 *   - iOS PiP requires AVAudioSession entitlement (set in ios/ntv/ntv.entitlements).
 *   - react-native-video v6+ API (pictureInPicture prop, HLS quality tracks).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv media-player feature status updated
 */

import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
  OnVideoErrorData,
  SelectedVideoTrackType,
  VideoRef,
} from 'react-native-video';
import { PlayerControls } from '../../components/PlayerControls';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlayerScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const streamUri = Array.isArray(uri) ? uri[0] : uri;

  const player = useMediaPlayer(streamUri);

  const {
    videoRef,
    isPlaying,
    isPiP,
    isFullscreen,
    volume,
    selectedQualityIndex,
    qualities,
    uiState,
    onVideoBuffer,
    onVideoError,
    onVideoProgress,
    onVideoLoad,
    onVideoEnd,
    // Controls passed to PlayerControls
    play,
    pause,
    seek,
    setVolume,
    toggleFullscreen,
    togglePiP,
    retry,
    selectQuality,
    showControlsFor,
    showControls,
    currentTime,
    duration,
    buffered,
    errorMessage,
  } = player;

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />

      {/* Video element — controls=false so we render custom controls */}
      {streamUri ? (
        <Video
          ref={videoRef as React.RefObject<VideoRef>}
          source={{ uri: streamUri }}
          style={styles.video}
          // Playback
          paused={!isPlaying}
          volume={volume}
          // HLS quality selection (-1 = auto, otherwise trackIndex)
          selectedVideoTrack={
            selectedQualityIndex === -1
              ? { type: SelectedVideoTrackType.AUTO }
              : { type: SelectedVideoTrackType.INDEX, value: selectedQualityIndex }
          }
          // Custom controls
          controls={false}
          // Fullscreen handled via ScreenOrientation, not native fullscreen
          fullscreen={false}
          // Buffering / repeat
          bufferConfig={{
            minBufferMs: 2500,
            maxBufferMs: 30000,
            bufferForPlaybackMs: 1000,
            bufferForPlaybackAfterRebufferMs: 2000,
          }}
          // Resize
          resizeMode="contain"
          // Handlers
          onBuffer={onVideoBuffer}
          onError={(error: OnVideoErrorData) =>
            onVideoError({
              error: {
                code: String(error.error?.errorCode),
                localizedDescription:
                  error.error?.localizedDescription ??
                  error.error?.localizedFailureReason,
              },
            })
          }
          onProgress={(data: OnProgressData) =>
            onVideoProgress({
              currentTime: data.currentTime,
              playableDuration: data.playableDuration,
              seekableDuration: data.seekableDuration,
            })
          }
          onLoad={(data: OnLoadData) =>
            onVideoLoad({ duration: data.duration })
          }
          onEnd={onVideoEnd}
          // iOS background audio: requires AVAudioSession category set to playback
          // (configured in AppDelegate.swift — outside this component)
          ignoreSilentSwitch="ignore"
          // Android background audio: playInBackground + react-native-track-player handoff
          playInBackground={Platform.OS === 'android'}
          playWhenInactive={Platform.OS === 'ios'}
        />
      ) : null}

      {/* Controls overlay — sits above the video */}
      <PlayerControls
        uiState={uiState}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        isPiP={isPiP}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        errorMessage={errorMessage}
        qualities={qualities}
        selectedQualityIndex={selectedQualityIndex}
        showControls={showControls}
        play={play}
        pause={pause}
        seek={seek}
        setVolume={setVolume}
        toggleFullscreen={toggleFullscreen}
        togglePiP={togglePiP}
        retry={retry}
        selectQuality={selectQuality}
        showControlsFor={showControlsFor}
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
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
