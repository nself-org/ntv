import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';

/// Resolution details returned by the stream-gateway for a given media item.
class StreamResolution {
  final String url;

  /// 'hls', 'dash', or 'mp4'
  final String format;

  /// Bitrate in kbps; null when unknown.
  final int? bitrate;

  /// Resolution string, e.g. '1920x1080'; null when unknown.
  final String? resolution;

  const StreamResolution({
    required this.url,
    required this.format,
    this.bitrate,
    this.resolution,
  });
}

/// Wraps stream-gateway plugin routes with typed return values.
class StreamGatewayService {
  final ApiService _api;

  StreamGatewayService(this._api);

  /// Resolves the best available stream URL for [mediaId] at [preferredQuality].
  ///
  /// Delegates to [ApiService.getStreamViaGateway] which sends the quality as
  /// an [X-Quality] header. The gateway chooses the nearest available variant
  /// and returns the resolved URL with format metadata.
  Future<StreamResolution> resolveStream(
    String mediaId,
    String preferredQuality,
  ) async {
    final info = await _api.getStreamViaGateway(mediaId, quality: preferredQuality);

    // Infer format from URL extension when the backend omits it.
    String format = info.format ?? _inferFormat(info.url);

    return StreamResolution(
      url: info.url,
      format: format,
      bitrate: null,
      resolution: null,
    );
  }

  String _inferFormat(String url) {
    final lower = url.toLowerCase();
    if (lower.contains('.m3u8')) return 'hls';
    if (lower.contains('.mpd')) return 'dash';
    return 'mp4';
  }
}

/// Global singleton provider for [StreamGatewayService].
final streamGatewayServiceProvider = Provider<StreamGatewayService>((ref) {
  final api = ref.read(apiServiceProvider);
  return StreamGatewayService(api);
});
