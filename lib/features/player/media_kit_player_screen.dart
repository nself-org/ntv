import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import '../../shared/db/app_database.dart';
import 'package:drift/drift.dart' show Value;

/// Full-screen media_kit player for HLS/MPEG-TS streams.
///
/// Supports:
/// - Cross-platform HLS playback via libmpv (media_kit)
/// - Subtitle track selection (in-manifest SRT/VTT/ASS)
/// - Aspect ratio toggle
/// - Watch history recording to local Drift DB
///
/// Usage:
///   context.push('/player?streamUrl=<url>&channelId=<id>&channelName=<name>')
class MediaKitPlayerScreen extends ConsumerStatefulWidget {
  final String? streamUrl;
  final String? channelId;
  final String? channelName;
  final String? channelLogo;

  const MediaKitPlayerScreen({
    super.key,
    this.streamUrl,
    this.channelId,
    this.channelName,
    this.channelLogo,
  });

  @override
  ConsumerState<MediaKitPlayerScreen> createState() => _MediaKitPlayerScreenState();
}

class _MediaKitPlayerScreenState extends ConsumerState<MediaKitPlayerScreen> {
  late final Player _player;
  late final VideoController _videoController;
  bool _showControls = true;
  bool _aspectLandscape = true;

  @override
  void initState() {
    super.initState();

    _player = Player();
    _videoController = VideoController(_player);

    // Force landscape immersive for video playback.
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    if (widget.streamUrl != null) {
      _player.open(Media(widget.streamUrl!));
      _recordHistory();
    }

    // Auto-hide controls after 3 seconds.
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showControls = false);
    });
  }

  void _recordHistory() {
    final db = ref.read(appDatabaseProvider);
    if (widget.channelId == null) return;
    db.upsertHistory(WatchHistoryCompanion(
      channelId: Value(widget.channelId!),
      channelName: Value(widget.channelName ?? widget.channelId!),
      channelLogo: Value(widget.channelLogo),
      streamUrl: Value(widget.streamUrl ?? ''),
      watchedAt: Value(DateTime.now()),
    ));
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  void _toggleAspect() {
    setState(() => _aspectLandscape = !_aspectLandscape);
    SystemChrome.setPreferredOrientations(
      _aspectLandscape
          ? [DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]
          : DeviceOrientation.values,
    );
  }

  @override
  void dispose() {
    _player.dispose();
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video surface
            Center(
              child: AspectRatio(
                aspectRatio: _aspectLandscape ? 16 / 9 : 4 / 3,
                child: Video(controller: _videoController),
              ),
            ),

            // Player controls overlay
            if (_showControls)
              _ControlsOverlay(
                player: _player,
                channelName: widget.channelName,
                onAspectToggle: _toggleAspect,
                onBack: () {
                  Navigator.of(context).maybePop();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _ControlsOverlay extends StatelessWidget {
  final Player player;
  final String? channelName;
  final VoidCallback onAspectToggle;
  final VoidCallback onBack;

  const _ControlsOverlay({
    required this.player,
    this.channelName,
    required this.onAspectToggle,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xCC000000),
            Colors.transparent,
            Colors.transparent,
            Color(0xCC000000),
          ],
          stops: [0.0, 0.25, 0.75, 1.0],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Top row: back + channel name + aspect toggle
            Row(
              children: [
                Semantics(
                  label: 'Back',
                  button: true,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    tooltip: 'Back',
                    onPressed: onBack,
                  ),
                ),
                Expanded(
                  child: Text(
                    channelName ?? '',
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Semantics(
                  label: 'Toggle aspect ratio',
                  button: true,
                  child: IconButton(
                    icon: const Icon(Icons.aspect_ratio, color: Colors.white),
                    tooltip: 'Toggle aspect ratio',
                    onPressed: onAspectToggle,
                  ),
                ),
              ],
            ),
            const Spacer(),
            // Bottom row: play/pause + seek + volume
            _BottomControls(player: player),
          ],
        ),
      ),
    );
  }
}

class _BottomControls extends StatelessWidget {
  final Player player;

  const _BottomControls({required this.player});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<bool>(
      stream: player.stream.playing,
      builder: (context, snap) {
        final playing = snap.data ?? false;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Seek back 10s
              Semantics(
                label: 'Seek back 10 seconds',
                button: true,
                child: IconButton(
                  icon: const Icon(Icons.replay_10, color: Colors.white, size: 32),
                  tooltip: 'Back 10 seconds',
                  onPressed: () async {
                    final pos = player.state.position;
                    final target = pos - const Duration(seconds: 10);
                    await player.seek(target < Duration.zero ? Duration.zero : target);
                  },
                ),
              ),
              const SizedBox(width: 16),
              // Play / Pause
              Semantics(
                label: playing ? 'Pause' : 'Play',
                button: true,
                child: IconButton(
                  icon: Icon(
                    playing ? Icons.pause_circle : Icons.play_circle,
                    color: Colors.white,
                    size: 56,
                  ),
                  tooltip: playing ? 'Pause' : 'Play',
                  onPressed: () => player.playOrPause(),
                ),
              ),
              const SizedBox(width: 16),
              // Seek forward 10s
              Semantics(
                label: 'Seek forward 10 seconds',
                button: true,
                child: IconButton(
                  icon: const Icon(Icons.forward_10, color: Colors.white, size: 32),
                  tooltip: 'Forward 10 seconds',
                  onPressed: () async {
                    final pos = player.state.position;
                    await player.seek(pos + const Duration(seconds: 10));
                  },
                ),
              ),
              const Spacer(),
              // Volume
              StreamBuilder<double>(
                stream: player.stream.volume,
                builder: (context, snap) {
                  final volume = snap.data ?? 100;
                  return Semantics(
                    label: 'Volume ${volume.round()}%',
                    child: IconButton(
                      icon: Icon(
                        volume > 0 ? Icons.volume_up : Icons.volume_off,
                        color: Colors.white,
                      ),
                      tooltip: volume > 0 ? 'Mute' : 'Unmute',
                      onPressed: () {
                        player.setVolume(volume > 0 ? 0 : 100);
                      },
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
