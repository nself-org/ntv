/// Favorite channel entry stored in Drift local DB.
class Favorite {
  final String channelId;
  final String channelName;
  final String? channelLogo;
  final String streamUrl;
  final DateTime addedAt;

  const Favorite({
    required this.channelId,
    required this.channelName,
    this.channelLogo,
    required this.streamUrl,
    required this.addedAt,
  });
}
