// Channel and EPG data models for nTV IPTV and electronic program guide.
// Also includes live-channel models backed by the streaming plugin (T16).

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

// =============================================================================
// Live channel models — backed by streaming plugin /api/v1/channels (T16)
// =============================================================================

/// A live broadcast channel stored in the streaming plugin backend (HLS-based).
class LiveChannelInfo {
  final String id;
  final String name;
  final String? number;
  final String? logoUrl;
  final String? genre;
  final String hlsUrl;
  final bool active;
  final String? currentProgram;
  final String? nextProgram;

  const LiveChannelInfo({
    required this.id,
    required this.name,
    this.number,
    this.logoUrl,
    this.genre,
    required this.hlsUrl,
    required this.active,
    this.currentProgram,
    this.nextProgram,
  });

  factory LiveChannelInfo.fromJson(Map<String, dynamic> json) {
    return LiveChannelInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      number: json['number'] as String?,
      logoUrl: json['logo_url'] as String?,
      genre: json['genre'] as String?,
      hlsUrl: json['hls_url'] as String,
      active: json['active'] as bool? ?? true,
      currentProgram: json['current_program'] as String?,
      nextProgram: json['next_program'] as String?,
    );
  }
}

/// Paginated result from GET /api/v1/channels.
class LiveChannelListResult {
  final List<LiveChannelInfo> channels;
  final int total;
  final int page;
  final int pageSize;

  const LiveChannelListResult({
    required this.channels,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  bool get hasMore => page * pageSize < total;
}

/// HLS stream info + EPG enrichment from GET /api/v1/channels/{id}/stream.
class LiveChannelStream {
  final String channelId;
  final String name;
  final String hlsUrl;
  final String? currentProgram;
  final String? nextProgram;

  const LiveChannelStream({
    required this.channelId,
    required this.name,
    required this.hlsUrl,
    this.currentProgram,
    this.nextProgram,
  });

  factory LiveChannelStream.fromJson(Map<String, dynamic> json) {
    return LiveChannelStream(
      channelId: json['channel_id'] as String,
      name: json['name'] as String,
      hlsUrl: json['hls_url'] as String,
      currentProgram: json['current_program'] as String?,
      nextProgram: json['next_program'] as String?,
    );
  }
}

// =============================================================================
// DVR job models — schedule recordings via /api/v1/dvr (T15)
// =============================================================================

/// A scheduled or completed DVR recording job.
class DvrJob {
  final String id;
  final String channelId;
  final String? programTitle;
  final DateTime scheduledStart;
  final DateTime scheduledEnd;
  final String status;
  final String? storageUrl;

  const DvrJob({
    required this.id,
    required this.channelId,
    this.programTitle,
    required this.scheduledStart,
    required this.scheduledEnd,
    required this.status,
    this.storageUrl,
  });

  bool get isScheduled => status == 'scheduled';
  bool get isRecording => status == 'recording';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';

  Duration get duration => scheduledEnd.difference(scheduledStart);

  factory DvrJob.fromJson(Map<String, dynamic> json) {
    return DvrJob(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      programTitle: json['program_title'] as String?,
      scheduledStart: DateTime.parse(json['scheduled_start'] as String),
      scheduledEnd: DateTime.parse(json['scheduled_end'] as String),
      status: json['status'] as String? ?? 'scheduled',
      storageUrl: json['storage_url'] as String?,
    );
  }
}
