import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/channel.dart';

/// Fetches and parses M3U IPTV playlists.
class M3uService {
  final Dio _dio;

  M3uService()
      : _dio = Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
        ));

  /// Parses raw M3U text into a list of [Channel] objects.
  ///
  /// Handles #EXTM3U headers and #EXTINF metadata lines. Each #EXTINF line
  /// is followed by the stream URL on the next non-comment line.
  List<Channel> parseM3u(String content) {
    final channels = <Channel>[];
    final lines = content.split('\n').map((l) => l.trim()).toList();

    String? currentName;
    String? currentId;
    String? currentLogo;
    String? currentGroup;

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.isEmpty || line == '#EXTM3U') continue;

      if (line.startsWith('#EXTINF:')) {
        // Reset per-channel metadata.
        currentName = null;
        currentId = null;
        currentLogo = null;
        currentGroup = null;

        // Extract key="value" attributes from the #EXTINF line.
        currentId = _extractAttribute(line, 'tvg-id');
        currentLogo = _extractAttribute(line, 'tvg-logo');
        currentGroup = _extractAttribute(line, 'group-title');

        // Channel name is the text after the last comma.
        final commaIndex = line.lastIndexOf(',');
        if (commaIndex != -1 && commaIndex < line.length - 1) {
          currentName = line.substring(commaIndex + 1).trim();
        }
      } else if (!line.startsWith('#')) {
        // Stream URL line.
        final name = currentName ?? 'Channel ${channels.length + 1}';
        final id = currentId ?? '${currentGroup ?? 'ch'}_${channels.length}';
        channels.add(Channel(
          id: id,
          name: name,
          group: currentGroup,
          logoUrl: currentLogo,
          streamUrl: line,
        ));

        // Reset state for next channel.
        currentName = null;
        currentId = null;
        currentLogo = null;
        currentGroup = null;
      }
    }

    return channels;
  }

  /// Extracts the value of a named attribute from an #EXTINF line.
  /// Returns null if the attribute is absent.
  String? _extractAttribute(String line, String attr) {
    final pattern = '$attr="';
    final start = line.indexOf(pattern);
    if (start == -1) return null;
    final valueStart = start + pattern.length;
    final end = line.indexOf('"', valueStart);
    if (end == -1) return null;
    final value = line.substring(valueStart, end).trim();
    return value.isEmpty ? null : value;
  }

  /// Fetches an M3U playlist from [url] and returns a parsed channel list.
  Future<List<Channel>> fetchPlaylist(String url) async {
    final response = await _dio.get<String>(
      url,
      options: Options(responseType: ResponseType.plain),
    );
    final content = response.data ?? '';
    return parseM3u(content);
  }
}

/// Global singleton provider for [M3uService].
final m3uServiceProvider = Provider<M3uService>((ref) => M3uService());

/// Family provider that fetches and parses a playlist by URL.
/// Results are cached until the provider is invalidated.
final playlistProvider =
    FutureProvider.family<List<Channel>, String>((ref, url) async {
  final service = ref.read(m3uServiceProvider);
  return service.fetchPlaylist(url);
});
