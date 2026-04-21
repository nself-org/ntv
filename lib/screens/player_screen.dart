import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../models/media.dart';
import '../services/api_service.dart';

/// Provider to fetch the stream URL for a given media ID.
final streamInfoProvider = FutureProvider.family<StreamInfo, String>((ref, mediaId) async {
  final api = ref.read(apiServiceProvider);
  return api.getStreamUrl(mediaId);
});

class PlayerScreen extends ConsumerStatefulWidget {
  final String? mediaId;

  /// Direct stream URL for IPTV channels. When set, [mediaId] is ignored
  /// and no backend stream resolution is performed.
  final String? streamUrl;

  const PlayerScreen({super.key, this.mediaId, this.streamUrl});

  @override
  ConsumerState<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends ConsumerState<PlayerScreen> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _isInitialized = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Force landscape for video playback.
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    if (widget.streamUrl != null) {
      _loadDirectStream(widget.streamUrl!);
    } else if (widget.mediaId != null) {
      _loadStream();
    }
  }

  Future<void> _loadDirectStream(String url) async {
    try {
      await _initPlayer(StreamInfo(url: url));
    } catch (e) {
      setState(() => _error = 'Failed to load stream: $e');
    }
  }

  Future<void> _loadStream() async {
    try {
      final api = ref.read(apiServiceProvider);
      if (!api.isConfigured) {
        setState(() => _error = 'Backend not configured. Go to Settings first.');
        return;
      }
      final stream = await api.getStreamUrl(widget.mediaId!);
      await _initPlayer(stream);
    } catch (e) {
      setState(() => _error = 'Failed to load stream: $e');
    }
  }

  Future<void> _initPlayer(StreamInfo stream) async {
    _videoController = VideoPlayerController.networkUrl(
      Uri.parse(stream.url),
      httpHeaders: stream.headers,
    );

    await _videoController!.initialize();

    _chewieController = ChewieController(
      videoPlayerController: _videoController!,
      autoPlay: true,
      allowFullScreen: true,
      allowMuting: true,
      showControlsOnInitialize: false,
      errorBuilder: (context, errorMessage) {
        return Center(
          child: Text('Playback error: $errorMessage',
              style: const TextStyle(color: Colors.white)),
        );
      },
    );

    if (mounted) {
      setState(() => _isInitialized = true);
    }

    // Save progress periodically.
    _videoController!.addListener(_onPositionChanged);
  }

  Duration _lastSavedPosition = Duration.zero;

  void _onPositionChanged() {
    final pos = _videoController?.value.position ?? Duration.zero;
    // Save every 10 seconds of progress.
    if ((pos - _lastSavedPosition).inSeconds.abs() >= 10 && widget.mediaId != null) {
      _lastSavedPosition = pos;
      final api = ref.read(apiServiceProvider);
      api.saveProgress(widget.mediaId!, pos).catchError((_) {});
    }
  }

  @override
  void dispose() {
    _videoController?.removeListener(_onPositionChanged);
    _chewieController?.dispose();
    _videoController?.dispose();
    // Restore orientation.
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (_isInitialized && _chewieController != null)
            Center(child: Chewie(controller: _chewieController!))
          else if (_error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Semantics(
                  liveRegion: true,
                  label: 'Playback error: ${_error!}',
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const ExcludeSemantics(
                        child: Icon(Icons.error_outline, size: 64, color: Colors.white38),
                      ),
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(color: Colors.white70),
                          textAlign: TextAlign.center),
                      const SizedBox(height: 24),
                      OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Go Back'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (widget.mediaId == null && widget.streamUrl == null)
            Center(
              child: Semantics(
                liveRegion: true,
                label: 'No media selected. Choose something from your library to play.',
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ExcludeSemantics(
                      child: Icon(Icons.play_circle_outline, size: 120, color: Colors.white54),
                    ),
                    SizedBox(height: 16),
                    Text('No media selected.', style: TextStyle(color: Colors.white54)),
                    SizedBox(height: 8),
                    Text('Choose something from your library to play.',
                        style: TextStyle(color: Colors.white38, fontSize: 12)),
                  ],
                ),
              ),
            )
          else
            const Center(child: CircularProgressIndicator()),

          // Back button overlay (a11y: icon-only button needs explicit label).
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Semantics(
                button: true,
                label: 'Back',
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  tooltip: 'Back',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
