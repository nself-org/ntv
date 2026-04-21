/// Core media data models for nTV.
library;

enum MediaType { movie, tvShow, episode }

class Media {
  final String id;
  final String title;
  final String? overview;
  final String? posterUrl;
  final String? backdropUrl;
  final MediaType type;
  final double? rating;
  final String? releaseDate;
  final List<String> genres;
  final int? runtime; // minutes
  final int? seasonCount;

  const Media({
    required this.id,
    required this.title,
    this.overview,
    this.posterUrl,
    this.backdropUrl,
    required this.type,
    this.rating,
    this.releaseDate,
    this.genres = const [],
    this.runtime,
    this.seasonCount,
  });

  factory Media.fromJson(Map<String, dynamic> json) {
    return Media(
      id: json['id'].toString(),
      title: json['title'] as String? ?? json['name'] as String? ?? '',
      overview: json['overview'] as String?,
      posterUrl: json['poster_url'] as String? ?? json['poster_path'] as String?,
      backdropUrl: json['backdrop_url'] as String? ?? json['backdrop_path'] as String?,
      type: _parseType(json['media_type'] as String?),
      rating: (json['vote_average'] as num?)?.toDouble(),
      releaseDate: json['release_date'] as String? ?? json['first_air_date'] as String?,
      genres: (json['genres'] as List<dynamic>?)
              ?.map((g) => g is Map ? g['name'] as String : g.toString())
              .toList() ??
          [],
      runtime: json['runtime'] as int?,
      seasonCount: json['number_of_seasons'] as int?,
    );
  }

  static MediaType _parseType(String? type) {
    switch (type) {
      case 'tv':
      case 'tvShow':
        return MediaType.tvShow;
      case 'episode':
        return MediaType.episode;
      default:
        return MediaType.movie;
    }
  }
}

class Episode {
  final String id;
  final String title;
  final String? overview;
  final int seasonNumber;
  final int episodeNumber;
  final String? stillUrl;
  final int? runtime;

  const Episode({
    required this.id,
    required this.title,
    this.overview,
    required this.seasonNumber,
    required this.episodeNumber,
    this.stillUrl,
    this.runtime,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      id: json['id'].toString(),
      title: json['name'] as String? ?? json['title'] as String? ?? '',
      overview: json['overview'] as String?,
      seasonNumber: json['season_number'] as int? ?? 1,
      episodeNumber: json['episode_number'] as int? ?? 1,
      stillUrl: json['still_path'] as String?,
      runtime: json['runtime'] as int?,
    );
  }
}

class StreamInfo {
  final String url;
  final String? format; // hls, dash, mp4
  final Map<String, String> headers;

  const StreamInfo({
    required this.url,
    this.format,
    this.headers = const {},
  });

  factory StreamInfo.fromJson(Map<String, dynamic> json) {
    return StreamInfo(
      url: json['url'] as String,
      format: json['format'] as String?,
      headers: (json['headers'] as Map<String, dynamic>?)
              ?.map((k, v) => MapEntry(k, v.toString())) ??
          {},
    );
  }
}
