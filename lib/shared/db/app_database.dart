// ignore_for_file: prefer_const_constructors
// Drift database — requires `dart run build_runner build` to generate
// `app_database.g.dart` before this file compiles without errors.
// Run: cd ntv && dart run build_runner build --delete-conflicting-outputs
//
// The generated file is NOT committed to source control (in .gitignore).
// CI runs build_runner as a pre-build step.

import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

// ── Table definitions ────────────────────────────────────────────────────────

/// Favorite channels table.
class Favorites extends Table {
  TextColumn get channelId => text()();
  TextColumn get channelName => text()();
  TextColumn get channelLogo => text().nullable()();
  TextColumn get streamUrl => text()();
  DateTimeColumn get addedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {channelId};
}

/// Watch history table — capped at 50 entries in application logic.
class WatchHistory extends Table {
  TextColumn get channelId => text()();
  TextColumn get channelName => text()();
  TextColumn get channelLogo => text().nullable()();
  TextColumn get streamUrl => text()();
  DateTimeColumn get watchedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {channelId};
}

/// EPG program entries cached locally.
class EpgCache extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get channelId => text()();
  TextColumn get title => text()();
  DateTimeColumn get start => dateTime()();
  DateTimeColumn get end => dateTime()();
  TextColumn get description => text().nullable()();
}

// ── Database ─────────────────────────────────────────────────────────────────

@DriftDatabase(tables: [Favorites, WatchHistory, EpgCache])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // ── Favorites ──────────────────────────────────────────────────────────────

  Future<List<Favorite>> allFavorites() => select(favorites).get();

  Stream<List<Favorite>> watchFavorites() => select(favorites).watch();

  Future<bool> isFavorite(String channelId) async {
    final row = await (select(favorites)
              ..where((t) => t.channelId.equals(channelId)))
            .getSingleOrNull();
    return row != null;
  }

  Future<void> addFavorite(FavoritesCompanion entry) =>
      into(favorites).insertOnConflictUpdate(entry);

  Future<void> removeFavorite(String channelId) =>
      (delete(favorites)..where((t) => t.channelId.equals(channelId))).go();

  // ── Watch history ──────────────────────────────────────────────────────────

  Future<List<WatchHistoryData>> recentHistory({int limit = 50}) =>
      (select(watchHistory)
            ..orderBy([(t) => OrderingTerm.desc(t.watchedAt)])
            ..limit(limit))
          .get();

  Stream<List<WatchHistoryData>> watchHistory$({int limit = 50}) =>
      (select(watchHistory)
            ..orderBy([(t) => OrderingTerm.desc(t.watchedAt)])
            ..limit(limit))
          .watch();

  Future<void> upsertHistory(WatchHistoryCompanion entry) async {
    await into(watchHistory).insertOnConflictUpdate(entry);
    // Prune oldest entries beyond 50.
    final rows = await recentHistory(limit: 10000);
    if (rows.length > 50) {
      final toDelete = rows.sublist(50);
      for (final row in toDelete) {
        await (delete(watchHistory)
              ..where((t) => t.channelId.equals(row.channelId)))
            .go();
      }
    }
  }

  // ── EPG cache ──────────────────────────────────────────────────────────────

  Future<void> replaceEpgForChannel(
      String channelId, List<EpgCacheCompanion> entries) async {
    await transaction(() async {
      await (delete(epgCache)..where((t) => t.channelId.equals(channelId)))
          .go();
      await batch((b) => b.insertAll(epgCache, entries));
    });
  }

  Future<List<EpgCacheData>> epgForChannel(String channelId) =>
      (select(epgCache)
            ..where((t) => t.channelId.equals(channelId))
            ..orderBy([(t) => OrderingTerm.asc(t.start)]))
          .get();

  Future<void> pruneStaleEpg() async {
    final cutoff = DateTime.now().subtract(const Duration(days: 7));
    await (delete(epgCache)..where((t) => t.end.isSmallerThanValue(cutoff)))
        .go();
  }
}

// ── Connection helper ─────────────────────────────────────────────────────────

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbDir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbDir.path, 'ntv.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});
