import 'package:audio_service/audio_service.dart';
import 'package:media_kit/media_kit.dart';

/// AudioHandler that bridges audio_service (lock screen controls, background
/// session) to the media_kit [Player].
///
/// Registration: call [BackgroundAudioHandler.init] once at app start.
/// iOS: requires AVAudioSession category `.playback` (configured in AppDelegate).
/// Android: requires FOREGROUND_SERVICE permission in AndroidManifest.xml.
class BackgroundAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  final Player _player;

  BackgroundAudioHandler(this._player) {
    // Mirror player playing/paused state to AudioService playback state.
    _player.stream.playing.listen((playing) {
      playbackState.add(playbackState.value.copyWith(
        playing: playing,
        controls: [
          if (playing) MediaControl.pause else MediaControl.play,
          MediaControl.stop,
        ],
        processingState: AudioProcessingState.ready,
      ));
    });
  }

  /// Call once at app start to register this handler with AudioService.
  static Future<BackgroundAudioHandler> init(Player player) async {
    return AudioService.init(
      builder: () => BackgroundAudioHandler(player),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'org.nself.ntv.channel.audio',
        androidNotificationChannelName: 'nTV Playback',
        androidNotificationOngoing: true,
        androidStopForegroundOnPause: true,
      ),
    );
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> stop() => _player.stop();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  /// Update the lock screen media metadata for the current channel.
  void setChannelMediaItem({required String channelName, String? artUri}) {
    mediaItem.add(MediaItem(
      id: channelName,
      title: channelName,
      artUri: artUri != null ? Uri.parse(artUri) : null,
    ));
  }
}
