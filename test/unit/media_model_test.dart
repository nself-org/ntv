import 'package:flutter_test/flutter_test.dart';
import 'package:ntv/models/media.dart';

void main() {
  group('Media.fromJson', () {
    test('parses movie with all fields', () {
      final m = Media.fromJson({
        'id': 42,
        'title': 'Test Movie',
        'overview': 'A test film.',
        'poster_url': 'http://img.example.com/poster.jpg',
        'backdrop_url': 'http://img.example.com/backdrop.jpg',
        'media_type': 'movie',
        'vote_average': 7.5,
        'release_date': '2024-06-01',
        'genres': [
          {'name': 'Action'},
          {'name': 'Drama'},
        ],
        'runtime': 120,
      });

      expect(m.id, '42');
      expect(m.title, 'Test Movie');
      expect(m.overview, 'A test film.');
      expect(m.posterUrl, 'http://img.example.com/poster.jpg');
      expect(m.backdropUrl, 'http://img.example.com/backdrop.jpg');
      expect(m.type, MediaType.movie);
      expect(m.rating, 7.5);
      expect(m.releaseDate, '2024-06-01');
      expect(m.genres, ['Action', 'Drama']);
      expect(m.runtime, 120);
    });

    test('parses TV show by media_type', () {
      final m = Media.fromJson({
        'id': '10',
        'name': 'Test Show',
        'media_type': 'tv',
        'number_of_seasons': 3,
        'first_air_date': '2020-01-15',
      });

      expect(m.type, MediaType.tvShow);
      expect(m.title, 'Test Show');
      expect(m.seasonCount, 3);
      expect(m.releaseDate, '2020-01-15');
    });

    test('falls back to name when title is absent', () {
      final m = Media.fromJson(
          {'id': '1', 'name': 'Name Only', 'media_type': 'movie'});
      expect(m.title, 'Name Only');
    });

    test('defaults to empty title when both title and name absent', () {
      final m = Media.fromJson({'id': '1', 'media_type': 'movie'});
      expect(m.title, '');
    });

    test('defaults to empty genres list', () {
      final m =
          Media.fromJson({'id': '1', 'title': 'X', 'media_type': 'movie'});
      expect(m.genres, isEmpty);
    });

    test('parses episode media_type', () {
      final m =
          Media.fromJson({'id': '5', 'title': 'Ep 1', 'media_type': 'episode'});
      expect(m.type, MediaType.episode);
    });

    test('defaults to movie for unknown media_type', () {
      final m =
          Media.fromJson({'id': '1', 'title': 'X', 'media_type': 'unknown'});
      expect(m.type, MediaType.movie);
    });

    test('handles genre strings (non-map entries)', () {
      final m = Media.fromJson({
        'id': '1',
        'title': 'X',
        'media_type': 'movie',
        'genres': ['Comedy', 'Romance'],
      });
      expect(m.genres, ['Comedy', 'Romance']);
    });

    test('uses poster_path fallback when poster_url absent', () {
      final m = Media.fromJson({
        'id': '1',
        'title': 'X',
        'media_type': 'movie',
        'poster_path': '/path/to/poster.jpg',
      });
      expect(m.posterUrl, '/path/to/poster.jpg');
    });

    test('uses backdrop_path fallback when backdrop_url absent', () {
      final m = Media.fromJson({
        'id': '1',
        'title': 'X',
        'media_type': 'movie',
        'backdrop_path': '/path/to/backdrop.jpg',
      });
      expect(m.backdropUrl, '/path/to/backdrop.jpg');
    });

    test('tvShow via tvShow media_type string', () {
      final m =
          Media.fromJson({'id': '1', 'title': 'X', 'media_type': 'tvShow'});
      expect(m.type, MediaType.tvShow);
    });
  });

  group('Episode.fromJson', () {
    test('parses all fields', () {
      final e = Episode.fromJson({
        'id': '101',
        'name': 'Pilot',
        'overview': 'The first episode.',
        'season_number': 1,
        'episode_number': 1,
        'still_path': '/still.jpg',
        'runtime': 45,
      });

      expect(e.id, '101');
      expect(e.title, 'Pilot');
      expect(e.overview, 'The first episode.');
      expect(e.seasonNumber, 1);
      expect(e.episodeNumber, 1);
      expect(e.stillUrl, '/still.jpg');
      expect(e.runtime, 45);
    });

    test('falls back to title key when name absent', () {
      final e = Episode.fromJson({
        'id': '2',
        'title': 'Episode 2',
        'season_number': 1,
        'episode_number': 2,
      });
      expect(e.title, 'Episode 2');
    });

    test('defaults season and episode to 1 when absent', () {
      final e = Episode.fromJson({'id': '3'});
      expect(e.seasonNumber, 1);
      expect(e.episodeNumber, 1);
    });

    test('defaults title to empty string when both name and title absent', () {
      final e = Episode.fromJson({'id': '4'});
      expect(e.title, '');
    });
  });

  group('StreamInfo.fromJson', () {
    test('parses url, format, and headers', () {
      final s = StreamInfo.fromJson({
        'url': 'http://stream.example.com/live.m3u8',
        'format': 'hls',
        'headers': {'Authorization': 'Bearer tok', 'X-Custom': '1'},
      });

      expect(s.url, 'http://stream.example.com/live.m3u8');
      expect(s.format, 'hls');
      expect(s.headers['Authorization'], 'Bearer tok');
      expect(s.headers['X-Custom'], '1');
    });

    test('defaults to empty headers when absent', () {
      final s =
          StreamInfo.fromJson({'url': 'http://stream.example.com/live.m3u8'});
      expect(s.headers, isEmpty);
      expect(s.format, isNull);
    });
  });
}
