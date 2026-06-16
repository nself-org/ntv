import 'package:flutter_test/flutter_test.dart';
import 'package:ntv/models/channel.dart';

void main() {
  group('EpgProgram', () {
    test('isNow returns true when current time is between start and end', () {
      final now = DateTime.now();
      final program = EpgProgram(
        channelId: 'ch1',
        title: 'News',
        start: now.subtract(const Duration(minutes: 5)),
        end: now.add(const Duration(minutes: 25)),
      );
      expect(program.isNow, isTrue);
    });

    test('isNow returns false for past program', () {
      final now = DateTime.now();
      final program = EpgProgram(
        channelId: 'ch1',
        title: 'Old Show',
        start: now.subtract(const Duration(hours: 2)),
        end: now.subtract(const Duration(hours: 1)),
      );
      expect(program.isNow, isFalse);
    });

    test('isNow returns false for future program', () {
      final now = DateTime.now();
      final program = EpgProgram(
        channelId: 'ch1',
        title: 'Future Show',
        start: now.add(const Duration(hours: 1)),
        end: now.add(const Duration(hours: 2)),
      );
      expect(program.isNow, isFalse);
    });

    test('duration returns correct difference', () {
      final now = DateTime.now();
      final program = EpgProgram(
        channelId: 'ch1',
        title: 'Film',
        start: now,
        end: now.add(const Duration(minutes: 90)),
      );
      expect(program.duration, const Duration(minutes: 90));
    });

    test('fromJson parses all fields', () {
      final json = {
        'channel_id': 'bbc1',
        'title': 'Six O\'Clock News',
        'start': '2026-05-19T18:00:00.000Z',
        'end': '2026-05-19T18:30:00.000Z',
        'description': 'The latest news.',
      };
      final p = EpgProgram.fromJson(json);
      expect(p.channelId, 'bbc1');
      expect(p.title, 'Six O\'Clock News');
      expect(p.description, 'The latest news.');
      expect(p.start, DateTime.parse('2026-05-19T18:00:00.000Z'));
      expect(p.end, DateTime.parse('2026-05-19T18:30:00.000Z'));
    });

    test('fromJson defaults title to empty string when absent', () {
      final p = EpgProgram.fromJson({
        'channel_id': '1',
        'start': '2026-05-19T18:00:00.000Z',
        'end': '2026-05-19T18:30:00.000Z',
      });
      expect(p.title, '');
    });
  });

  group('EpgSchedule', () {
    late DateTime now;
    late EpgSchedule schedule;

    setUp(() {
      now = DateTime.now();
      schedule = EpgSchedule(
        channelId: 'ch1',
        programs: [
          EpgProgram(
            channelId: 'ch1',
            title: 'Past Show',
            start: now.subtract(const Duration(hours: 2)),
            end: now.subtract(const Duration(hours: 1)),
          ),
          EpgProgram(
            channelId: 'ch1',
            title: 'Live Now',
            start: now.subtract(const Duration(minutes: 10)),
            end: now.add(const Duration(minutes: 50)),
          ),
          EpgProgram(
            channelId: 'ch1',
            title: 'Coming Up',
            start: now.add(const Duration(hours: 1)),
            end: now.add(const Duration(hours: 2)),
          ),
        ],
      );
    });

    test('currentProgram returns the currently airing show', () {
      expect(schedule.currentProgram?.title, 'Live Now');
    });

    test('upcomingPrograms returns only future programs', () {
      final upcoming = schedule.upcomingPrograms;
      expect(upcoming.length, 1);
      expect(upcoming.first.title, 'Coming Up');
    });

    test('currentProgram returns null when nothing is airing', () {
      final past = EpgSchedule(
        channelId: 'ch2',
        programs: [
          EpgProgram(
            channelId: 'ch2',
            title: 'Old',
            start: now.subtract(const Duration(hours: 3)),
            end: now.subtract(const Duration(hours: 2)),
          ),
        ],
      );
      expect(past.currentProgram, isNull);
    });

    test('fromJson parses channel_id and programs list', () {
      final json = {
        'channel_id': 'cnn',
        'programs': [
          {
            'channel_id': 'cnn',
            'title': 'Morning Brief',
            'start': '2026-05-19T07:00:00.000Z',
            'end': '2026-05-19T08:00:00.000Z',
          },
        ],
      };
      final s = EpgSchedule.fromJson(json);
      expect(s.channelId, 'cnn');
      expect(s.programs.length, 1);
      expect(s.programs.first.title, 'Morning Brief');
    });

    test('fromJson handles missing programs key gracefully', () {
      final s = EpgSchedule.fromJson({'channel_id': 'ch99'});
      expect(s.programs, isEmpty);
    });
  });

  group('DvrJob', () {
    late DateTime start;
    late DateTime end;

    setUp(() {
      start = DateTime.now().add(const Duration(hours: 1));
      end = start.add(const Duration(hours: 2));
    });

    test('status helpers are correct', () {
      DvrJob make(String status) => DvrJob(
            id: '1',
            channelId: 'ch1',
            scheduledStart: start,
            scheduledEnd: end,
            status: status,
          );

      expect(make('scheduled').isScheduled, isTrue);
      expect(make('scheduled').isRecording, isFalse);
      expect(make('recording').isRecording, isTrue);
      expect(make('completed').isCompleted, isTrue);
      expect(make('failed').isFailed, isTrue);
    });

    test('duration returns difference between start and end', () {
      final job = DvrJob(
        id: '1',
        channelId: 'ch1',
        scheduledStart: start,
        scheduledEnd: end,
        status: 'scheduled',
      );
      expect(job.duration, const Duration(hours: 2));
    });

    test('fromJson parses all fields', () {
      final json = {
        'id': 'job1',
        'channel_id': 'espn',
        'program_title': 'NBA Finals',
        'scheduled_start': start.toIso8601String(),
        'scheduled_end': end.toIso8601String(),
        'status': 'scheduled',
        'storage_url': 'http://storage.example.com/job1.mp4',
      };
      final j = DvrJob.fromJson(json);
      expect(j.id, 'job1');
      expect(j.channelId, 'espn');
      expect(j.programTitle, 'NBA Finals');
      expect(j.status, 'scheduled');
      expect(j.storageUrl, 'http://storage.example.com/job1.mp4');
    });

    test('fromJson defaults status to scheduled when absent', () {
      final json = {
        'id': 'job2',
        'channel_id': 'ch1',
        'scheduled_start': start.toIso8601String(),
        'scheduled_end': end.toIso8601String(),
      };
      final j = DvrJob.fromJson(json);
      expect(j.status, 'scheduled');
    });
  });

  group('LiveChannelInfo.fromJson', () {
    test('parses all fields', () {
      final json = {
        'id': 'lch1',
        'name': 'BBC News',
        'number': '501',
        'logo_url': 'http://logos.example.com/bbc.png',
        'genre': 'News',
        'hls_url': 'http://stream.example.com/bbc.m3u8',
        'active': true,
        'current_program': 'Breakfast',
        'next_program': 'Midday News',
      };
      final ch = LiveChannelInfo.fromJson(json);
      expect(ch.id, 'lch1');
      expect(ch.name, 'BBC News');
      expect(ch.number, '501');
      expect(ch.genre, 'News');
      expect(ch.active, isTrue);
      expect(ch.currentProgram, 'Breakfast');
      expect(ch.nextProgram, 'Midday News');
    });

    test('defaults active to true when absent', () {
      final ch = LiveChannelInfo.fromJson({
        'id': '1',
        'name': 'Test',
        'hls_url': 'http://stream.example.com/test.m3u8',
      });
      expect(ch.active, isTrue);
    });
  });

  group('LiveChannelStream.fromJson', () {
    test('parses all fields', () {
      final json = {
        'channel_id': 'ch1',
        'name': 'Sky Sports',
        'hls_url': 'http://stream.example.com/sky.m3u8',
        'current_program': 'Premier League',
        'next_program': 'Match of the Day',
      };
      final s = LiveChannelStream.fromJson(json);
      expect(s.channelId, 'ch1');
      expect(s.name, 'Sky Sports');
      expect(s.hlsUrl, 'http://stream.example.com/sky.m3u8');
      expect(s.currentProgram, 'Premier League');
      expect(s.nextProgram, 'Match of the Day');
    });

    test('handles null optional fields', () {
      final s = LiveChannelStream.fromJson({
        'channel_id': 'ch2',
        'name': 'Test',
        'hls_url': 'http://stream.example.com/test.m3u8',
      });
      expect(s.currentProgram, isNull);
      expect(s.nextProgram, isNull);
    });
  });
}
