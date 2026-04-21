import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/media.dart';
import '../models/channel.dart';

/// HTTP client connecting to nSelf backend with nTV plugins.
class ApiService {
  final Dio _dio;
  String? _baseUrl;
  String? _apiKey;
  String _preferredQuality = 'auto';

  ApiService()
      : _dio = Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
        ));

  bool get isConfigured => _baseUrl != null && _baseUrl!.isNotEmpty;

  void configure({required String baseUrl, String? apiKey, String? preferredQuality}) {
    _baseUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    _apiKey = apiKey;
    _dio.options.baseUrl = _baseUrl!;
    if (_apiKey != null && _apiKey!.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $_apiKey';
    }
    if (preferredQuality != null) {
      _preferredQuality = preferredQuality;
    }
  }

  void setPreferredQuality(String quality) {
    _preferredQuality = quality;
  }

  /// GET /streaming/library — list all media items.
  Future<List<Media>> getLibrary({String? genre, String? query}) async {
    final params = <String, dynamic>{};
    if (genre != null) params['genre'] = genre;
    if (query != null) params['q'] = query;

    final response = await _dio.get('/streaming/library', queryParameters: params);
    final items = response.data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Media.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /tmdb/movie/{id} or /tmdb/tv/{id} — media details with metadata.
  Future<Media> getMediaDetails(String id, {MediaType type = MediaType.movie}) async {
    final path = type == MediaType.tvShow ? '/tmdb/tv/$id' : '/tmdb/movie/$id';
    final response = await _dio.get(path);
    return Media.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /tmdb/tv/{id}/season/{season} — episode list for a season.
  Future<List<Episode>> getEpisodes(String showId, int season) async {
    final response = await _dio.get('/tmdb/tv/$showId/season/$season');
    final episodes = response.data['episodes'] as List<dynamic>? ?? [];
    return episodes.map((e) => Episode.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /streaming/play/{id} — get stream URL for playback.
  /// Attempts the stream-gateway endpoint first; falls back to the direct
  /// streaming plugin route when the gateway is unavailable.
  Future<StreamInfo> getStreamUrl(String mediaId) async {
    try {
      return await getStreamViaGateway(mediaId);
    } on DioException {
      final response = await _dio.get('/streaming/play/$mediaId');
      return StreamInfo.fromJson(response.data as Map<String, dynamic>);
    }
  }

  /// GET /stream-gateway/play/{mediaId} — fetch stream URL via stream-gateway plugin.
  ///
  /// Sends the preferred quality as an [X-Quality] header so the gateway can
  /// select the appropriate bitrate variant.
  Future<StreamInfo> getStreamViaGateway(String mediaId, {String? quality}) async {
    final q = quality ?? _preferredQuality;
    final response = await _dio.get(
      '/stream-gateway/play/$mediaId',
      options: Options(headers: {'X-Quality': q}),
    );
    return StreamInfo.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /streaming/continue — items with saved progress.
  Future<List<Media>> getContinueWatching() async {
    final response = await _dio.get('/streaming/continue');
    final items = response.data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Media.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// POST /streaming/progress — save playback position.
  Future<void> saveProgress(String mediaId, Duration position) async {
    await _dio.post('/streaming/progress', data: {
      'media_id': mediaId,
      'position_seconds': position.inSeconds,
    });
  }

  /// GET /streaming/genres — available genre list.
  Future<List<String>> getGenres() async {
    final response = await _dio.get('/streaming/genres');
    final genres = response.data['genres'] as List<dynamic>? ?? [];
    return genres.map((e) => e.toString()).toList();
  }

  /// GET /epg/schedule — EPG schedules for a set of channel IDs.
  ///
  /// [date] defaults to today when omitted.
  Future<List<EpgSchedule>> getEpgSchedule(
    List<String> channelIds, {
    DateTime? date,
  }) async {
    final params = <String, dynamic>{
      'channels': channelIds.join(','),
    };
    if (date != null) {
      params['date'] =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }
    final response = await _dio.get('/epg/schedule', queryParameters: params);
    final schedules = response.data['schedules'] as List<dynamic>? ?? [];
    return schedules.map((e) => EpgSchedule.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /tmdb/search — search TMDB for movies or TV shows.
  ///
  /// [type] is either 'movie' or 'tv'.
  Future<List<Media>> searchTmdb(String query, {String type = 'movie'}) async {
    final response = await _dio.get(
      '/tmdb/search',
      queryParameters: {'q': query, 'type': type},
    );
    final items = response.data['results'] as List<dynamic>? ?? [];
    return items.map((e) => Media.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /media-processing/status/{jobId} — poll async transcoding job status.
  Future<Map<String, dynamic>> getTranscodeStatus(String jobId) async {
    final response = await _dio.get('/media-processing/status/$jobId');
    return response.data as Map<String, dynamic>;
  }
}

/// Global provider for the API service singleton.
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
