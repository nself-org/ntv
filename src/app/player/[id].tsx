/**
 * Purpose: Full-screen player screen — renders react-native-video for HLS/DASH/MP4/RTSP
 * streams, and routes audio-only (IPTV radio) streams through useBackgroundAudio so
 * playback continues on lock screen with native media controls.
 *
 * Inputs:
 *   - id: channel id from route params (resolved to stream URL via T03)
 *   - isAudioOnly: derived from channel type (audio stream → useBackgroundAudio)
 *
 * Outputs:
 *   - Full-screen video player with controls overlay
 *   - Lock screen / notification shade controls for audio streams
 *
 * Constraints:
 *   - useBackgroundAudio is the ONLY consumer of TrackPlayer — never call
 *     TrackPlayer directly from this screen.
 *   - For video streams react-native-video handles primary playback.
 *   - All strings i18n-wrapped via useNselfTranslation.
 *   - Accessibility labels on all interactive elements.
 *
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T10
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNselfTranslation } from '@nself/i18n';
import Video, { VideoRef } from 'react-native-video';
import { useRef, useEffect } from 'react';
import { useBackgroundAudio } from '../../../hooks/useBackgroundAudio';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect audio-only streams by URL extension or content type hint.
 * IPTV radio channels typically end in .aac, .mp3, .ogg, .m4a, or are
 * served as generic streams on ports without a video track indicator.
 */
function isAudioStream(uri: string): boolean {
  const lower = uri.toLowerCase();
  return (
    lower.endsWith('.aac') ||
    lower.endsWith('.mp3') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.m4a') ||
    lower.includes('/radio/') ||
    lower.includes('/audio/')
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlayerScreen(): React.ReactElement {
  const { id, uri, title, artwork } = useLocalSearchParams<{
    id: string;
    uri?: string;
    title?: string;
    artwork?: string;
  }>();
  const router = useRouter();
  const { t } = useNselfTranslation();
  const videoRef = useRef<VideoRef>(null);

  // Background audio hook — ONLY consumer of TrackPlayer in this screen
  const audio = useBackgroundAudio();

  const streamUri = Array.isArray(uri) ? uri[0] : uri ?? '';
  const channelTitle = Array.isArray(title) ? title[0] : title ?? `Channel ${id ?? ''}`;
  const artworkUrl = Array.isArray(artwork) ? artwork[0] : artwork;
  const audioOnly = streamUri ? isAudioStream(streamUri) : false;

  // Start audio stream when ready (audio-only channels)
  useEffect(() => {
    if (!audioOnly || !streamUri || !audio.isReady) return;

    audio.play(streamUri, {
      title: channelTitle,
      artist: 'nTV',
      artwork: artworkUrl,
    });

    return () => {
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOnly, streamUri, audio.isReady, channelTitle, artworkUrl]);

  return (
    <View style={styles.container}>
      {/* Video element — hidden for audio-only streams */}
      {!audioOnly && streamUri ? (
        <Video
          ref={videoRef}
          source={{ uri: streamUri }}
          style={styles.video}
          resizeMode="contain"
          paused={false}
        />
      ) : null}

      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t('closePlayer')}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.channelTitle}>{channelTitle}</Text>
          {audioOnly && (
            <Text style={styles.audioLabel}>{t('audioStream')}</Text>
          )}
          {audioOnly && (
            <View style={styles.audioControls}>
              <TouchableOpacity
                onPress={audio.isPlaying ? audio.pause : () =>
                  audio.play(streamUri, { title: channelTitle, artist: 'nTV', artwork: artworkUrl })
                }
                style={styles.audioBtn}
                accessibilityRole="button"
                accessibilityLabel={audio.isPlaying ? t('pause') : t('play')}
              >
                <Text style={styles.audioBtnText}>{audio.isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={audio.stop}
                style={styles.audioBtn}
                accessibilityRole="button"
                accessibilityLabel={t('stop')}
              >
                <Text style={styles.audioBtnText}>⏹</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  closeBtn: { padding: 8 },
  closeText: { color: '#fff', fontSize: 20 },
  channelTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  audioLabel: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  audioControls: { flexDirection: 'row', gap: 12, marginTop: 16 },
  audioBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnText: { color: '#fff', fontSize: 22 },
});
