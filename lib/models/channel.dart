// Channel and EPG data models for nTV IPTV and electronic program guide.

/// A single IPTV channel parsed from an M3U playlist.
class Channel {
  final String id;
  final String name;
  final String? group;
  final String? logoUrl;
  final String streamUrl;

  const Channel({
    required this.id,
    required this.name,
    this.group,
    this.logoUrl,
    required this.streamUrl,
  });
}

/// A single EPG program entry for a channel.
class EpgProgram {
  final String channelId;
  final String title;
  final DateTime start;
  final DateTime end;
  final String? description;

  const EpgProgram({
    required this.channelId,
    required this.title,
    required this.start,
    required this.end,
    this.description,
  });

  bool get isNow {
    final now = DateTime.now();
    return now.isAfter(start) && now.isBefore(end);
  }

  Duration get duration => end.difference(start);

  factory EpgProgram.fromJson(Map<String, dynamic> json) {
    return EpgProgram(
      channelId: json['channel_id'].toString(),
      title: json['title'] as String? ?? '',
      start: DateTime.parse(json['start'] as String),
      end: DateTime.parse(json['end'] as String),
      description: json['description'] as String?,
    );
  }
}

/// All EPG programs for a single channel.
class EpgSchedule {
  final String channelId;
  final List<EpgProgram> programs;

  const EpgSchedule({required this.channelId, required this.programs});

  EpgProgram? get currentProgram {
    final now = DateTime.now();
    for (final p in programs) {
      if (now.isAfter(p.start) && now.isBefore(p.end)) return p;
    }
    return null;
  }

  List<EpgProgram> get upcomingPrograms {
    final now = DateTime.now();
    return programs.where((p) => p.start.isAfter(now)).toList();
  }

  factory EpgSchedule.fromJson(Map<String, dynamic> json) {
    final programList = (json['programs'] as List<dynamic>? ?? [])
        .map((e) => EpgProgram.fromJson(e as Map<String, dynamic>))
        .toList();
    return EpgSchedule(
      channelId: json['channel_id'].toString(),
      programs: programList,
    );
  }
}
