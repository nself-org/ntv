import 'package:flutter_test/flutter_test.dart';
import 'package:ntv/services/m3u_service.dart';

void main() {
  late M3uService service;

  setUp(() => service = M3uService());

  group('M3uService.parseM3u', () {
    test('returns empty list for empty input', () {
      expect(service.parseM3u(''), isEmpty);
    });

    test('parses minimal #EXTM3U + one channel', () {
      const input = '''
#EXTM3U
#EXTINF:-1,BBC One
http://example.com/bbc.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.length, 1);
      expect(channels.first.name, 'BBC One');
      expect(channels.first.streamUrl, 'http://example.com/bbc.m3u8');
    });

    test('extracts tvg-id, tvg-logo, group-title attributes', () {
      const input = '''
#EXTM3U
#EXTINF:-1 tvg-id="bbc1" tvg-logo="http://logos.example.com/bbc1.png" group-title="News",BBC One
http://example.com/bbc.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.length, 1);
      final ch = channels.first;
      expect(ch.id, 'bbc1');
      expect(ch.logoUrl, 'http://logos.example.com/bbc1.png');
      expect(ch.group, 'News');
    });

    test('parses multiple channels', () {
      const input = '''
#EXTM3U
#EXTINF:-1 group-title="Sports",Sky Sports
http://example.com/sky.m3u8
#EXTINF:-1 group-title="News",CNN
http://example.com/cnn.m3u8
#EXTINF:-1 group-title="Sports",ESPN
http://example.com/espn.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.length, 3);
      expect(channels[0].name, 'Sky Sports');
      expect(channels[1].name, 'CNN');
      expect(channels[2].name, 'ESPN');
    });

    test('skips comment lines that are not #EXTINF', () {
      const input = '''
#EXTM3U x-tvg-url="http://epg.example.com/guide.xml"
#EXTINF:-1,Channel A
http://example.com/a.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.length, 1);
      expect(channels.first.name, 'Channel A');
    });

    test('handles missing tvg-id by generating a synthetic id', () {
      const input = '''
#EXTM3U
#EXTINF:-1 group-title="Kids",Cartoon Network
http://example.com/cn.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.first.id, isNotEmpty);
    });

    test('handles channel with no group gracefully', () {
      const input = '''
#EXTM3U
#EXTINF:-1,Local Channel
http://example.com/local.m3u8
''';
      final channels = service.parseM3u(input);
      expect(channels.first.group, isNull);
    });

    test('500-channel playlist parses in < 2000ms', () {
      final buffer = StringBuffer('#EXTM3U\n');
      for (var i = 0; i < 500; i++) {
        buffer.writeln('#EXTINF:-1 group-title="Group$i",Channel $i');
        buffer.writeln('http://example.com/stream$i.m3u8');
      }
      final start = DateTime.now();
      final channels = service.parseM3u(buffer.toString());
      final elapsed = DateTime.now().difference(start).inMilliseconds;
      expect(channels.length, 500);
      expect(elapsed, lessThan(2000));
    });
  });
}
