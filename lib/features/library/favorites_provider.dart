import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/db/app_database.dart';
import 'package:drift/drift.dart' show Value;

/// Provides a live stream of favorite channels from the local Drift DB.
final favoritesProvider = StreamProvider<List<Favorite>>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return db.watchFavorites();
});

/// Provides a live stream of recent watch history.
final watchHistoryProvider = StreamProvider<List<WatchHistoryData>>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return db.watchHistory$();
});

/// Helper notifier for toggling favorites.
class FavoritesNotifier extends StateNotifier<void> {
  final AppDatabase _db;

  FavoritesNotifier(this._db) : super(null);

  Future<void> toggle({
    required String channelId,
    required String channelName,
    String? channelLogo,
    required String streamUrl,
  }) async {
    final isFav = await _db.isFavorite(channelId);
    if (isFav) {
      await _db.removeFavorite(channelId);
    } else {
      await _db.addFavorite(FavoritesCompanion(
        channelId: Value(channelId),
        channelName: Value(channelName),
        channelLogo: Value(channelLogo),
        streamUrl: Value(streamUrl),
        addedAt: Value(DateTime.now()),
      ));
    }
  }

  Future<bool> isFavorite(String channelId) => _db.isFavorite(channelId);
}

final favoritesNotifierProvider =
    StateNotifierProvider<FavoritesNotifier, void>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return FavoritesNotifier(db);
});
