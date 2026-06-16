/// Watch history entry stored in Drift local DB.
/// Keeps the last 50 channels watched with timestamps.
class WatchHistoryEntry {
  final String channelId;
  final String channelName;
  final String? channelLogo;
  final String streamUrl;
  final DateTime watchedAt;

  const WatchHistoryEntry({
    required this.channelId,
    required this.channelName,
    this.channelLogo,
    required this.streamUrl,
    required this.watchedAt,
  });
}
