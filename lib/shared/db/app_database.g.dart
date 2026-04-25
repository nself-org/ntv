// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $FavoritesTable extends Favorites
    with TableInfo<$FavoritesTable, Favorite> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FavoritesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _channelIdMeta =
      const VerificationMeta('channelId');
  @override
  late final GeneratedColumn<String> channelId = GeneratedColumn<String>(
      'channel_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _channelNameMeta =
      const VerificationMeta('channelName');
  @override
  late final GeneratedColumn<String> channelName = GeneratedColumn<String>(
      'channel_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _channelLogoMeta =
      const VerificationMeta('channelLogo');
  @override
  late final GeneratedColumn<String> channelLogo = GeneratedColumn<String>(
      'channel_logo', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _streamUrlMeta =
      const VerificationMeta('streamUrl');
  @override
  late final GeneratedColumn<String> streamUrl = GeneratedColumn<String>(
      'stream_url', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _addedAtMeta =
      const VerificationMeta('addedAt');
  @override
  late final GeneratedColumn<DateTime> addedAt = GeneratedColumn<DateTime>(
      'added_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [channelId, channelName, channelLogo, streamUrl, addedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'favorites';
  @override
  VerificationContext validateIntegrity(Insertable<Favorite> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('channel_id')) {
      context.handle(_channelIdMeta,
          channelId.isAcceptableOrUnknown(data['channel_id']!, _channelIdMeta));
    } else if (isInserting) {
      context.missing(_channelIdMeta);
    }
    if (data.containsKey('channel_name')) {
      context.handle(
          _channelNameMeta,
          channelName.isAcceptableOrUnknown(
              data['channel_name']!, _channelNameMeta));
    } else if (isInserting) {
      context.missing(_channelNameMeta);
    }
    if (data.containsKey('channel_logo')) {
      context.handle(
          _channelLogoMeta,
          channelLogo.isAcceptableOrUnknown(
              data['channel_logo']!, _channelLogoMeta));
    }
    if (data.containsKey('stream_url')) {
      context.handle(_streamUrlMeta,
          streamUrl.isAcceptableOrUnknown(data['stream_url']!, _streamUrlMeta));
    } else if (isInserting) {
      context.missing(_streamUrlMeta);
    }
    if (data.containsKey('added_at')) {
      context.handle(_addedAtMeta,
          addedAt.isAcceptableOrUnknown(data['added_at']!, _addedAtMeta));
    } else if (isInserting) {
      context.missing(_addedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {channelId};
  @override
  Favorite map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Favorite(
      channelId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_id'])!,
      channelName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_name'])!,
      channelLogo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_logo']),
      streamUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}stream_url'])!,
      addedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}added_at'])!,
    );
  }

  @override
  $FavoritesTable createAlias(String alias) {
    return $FavoritesTable(attachedDatabase, alias);
  }
}

class Favorite extends DataClass implements Insertable<Favorite> {
  final String channelId;
  final String channelName;
  final String? channelLogo;
  final String streamUrl;
  final DateTime addedAt;
  const Favorite(
      {required this.channelId,
      required this.channelName,
      this.channelLogo,
      required this.streamUrl,
      required this.addedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['channel_id'] = Variable<String>(channelId);
    map['channel_name'] = Variable<String>(channelName);
    if (!nullToAbsent || channelLogo != null) {
      map['channel_logo'] = Variable<String>(channelLogo);
    }
    map['stream_url'] = Variable<String>(streamUrl);
    map['added_at'] = Variable<DateTime>(addedAt);
    return map;
  }

  FavoritesCompanion toCompanion(bool nullToAbsent) {
    return FavoritesCompanion(
      channelId: Value(channelId),
      channelName: Value(channelName),
      channelLogo: channelLogo == null && nullToAbsent
          ? const Value.absent()
          : Value(channelLogo),
      streamUrl: Value(streamUrl),
      addedAt: Value(addedAt),
    );
  }

  factory Favorite.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Favorite(
      channelId: serializer.fromJson<String>(json['channelId']),
      channelName: serializer.fromJson<String>(json['channelName']),
      channelLogo: serializer.fromJson<String?>(json['channelLogo']),
      streamUrl: serializer.fromJson<String>(json['streamUrl']),
      addedAt: serializer.fromJson<DateTime>(json['addedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'channelId': serializer.toJson<String>(channelId),
      'channelName': serializer.toJson<String>(channelName),
      'channelLogo': serializer.toJson<String?>(channelLogo),
      'streamUrl': serializer.toJson<String>(streamUrl),
      'addedAt': serializer.toJson<DateTime>(addedAt),
    };
  }

  Favorite copyWith(
          {String? channelId,
          String? channelName,
          Value<String?> channelLogo = const Value.absent(),
          String? streamUrl,
          DateTime? addedAt}) =>
      Favorite(
        channelId: channelId ?? this.channelId,
        channelName: channelName ?? this.channelName,
        channelLogo: channelLogo.present ? channelLogo.value : this.channelLogo,
        streamUrl: streamUrl ?? this.streamUrl,
        addedAt: addedAt ?? this.addedAt,
      );
  Favorite copyWithCompanion(FavoritesCompanion data) {
    return Favorite(
      channelId: data.channelId.present ? data.channelId.value : this.channelId,
      channelName:
          data.channelName.present ? data.channelName.value : this.channelName,
      channelLogo:
          data.channelLogo.present ? data.channelLogo.value : this.channelLogo,
      streamUrl: data.streamUrl.present ? data.streamUrl.value : this.streamUrl,
      addedAt: data.addedAt.present ? data.addedAt.value : this.addedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Favorite(')
          ..write('channelId: $channelId, ')
          ..write('channelName: $channelName, ')
          ..write('channelLogo: $channelLogo, ')
          ..write('streamUrl: $streamUrl, ')
          ..write('addedAt: $addedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(channelId, channelName, channelLogo, streamUrl, addedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Favorite &&
          other.channelId == this.channelId &&
          other.channelName == this.channelName &&
          other.channelLogo == this.channelLogo &&
          other.streamUrl == this.streamUrl &&
          other.addedAt == this.addedAt);
}

class FavoritesCompanion extends UpdateCompanion<Favorite> {
  final Value<String> channelId;
  final Value<String> channelName;
  final Value<String?> channelLogo;
  final Value<String> streamUrl;
  final Value<DateTime> addedAt;
  final Value<int> rowid;
  const FavoritesCompanion({
    this.channelId = const Value.absent(),
    this.channelName = const Value.absent(),
    this.channelLogo = const Value.absent(),
    this.streamUrl = const Value.absent(),
    this.addedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FavoritesCompanion.insert({
    required String channelId,
    required String channelName,
    this.channelLogo = const Value.absent(),
    required String streamUrl,
    required DateTime addedAt,
    this.rowid = const Value.absent(),
  })  : channelId = Value(channelId),
        channelName = Value(channelName),
        streamUrl = Value(streamUrl),
        addedAt = Value(addedAt);
  static Insertable<Favorite> custom({
    Expression<String>? channelId,
    Expression<String>? channelName,
    Expression<String>? channelLogo,
    Expression<String>? streamUrl,
    Expression<DateTime>? addedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (channelId != null) 'channel_id': channelId,
      if (channelName != null) 'channel_name': channelName,
      if (channelLogo != null) 'channel_logo': channelLogo,
      if (streamUrl != null) 'stream_url': streamUrl,
      if (addedAt != null) 'added_at': addedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FavoritesCompanion copyWith(
      {Value<String>? channelId,
      Value<String>? channelName,
      Value<String?>? channelLogo,
      Value<String>? streamUrl,
      Value<DateTime>? addedAt,
      Value<int>? rowid}) {
    return FavoritesCompanion(
      channelId: channelId ?? this.channelId,
      channelName: channelName ?? this.channelName,
      channelLogo: channelLogo ?? this.channelLogo,
      streamUrl: streamUrl ?? this.streamUrl,
      addedAt: addedAt ?? this.addedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (channelId.present) {
      map['channel_id'] = Variable<String>(channelId.value);
    }
    if (channelName.present) {
      map['channel_name'] = Variable<String>(channelName.value);
    }
    if (channelLogo.present) {
      map['channel_logo'] = Variable<String>(channelLogo.value);
    }
    if (streamUrl.present) {
      map['stream_url'] = Variable<String>(streamUrl.value);
    }
    if (addedAt.present) {
      map['added_at'] = Variable<DateTime>(addedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FavoritesCompanion(')
          ..write('channelId: $channelId, ')
          ..write('channelName: $channelName, ')
          ..write('channelLogo: $channelLogo, ')
          ..write('streamUrl: $streamUrl, ')
          ..write('addedAt: $addedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $WatchHistoryTable extends WatchHistory
    with TableInfo<$WatchHistoryTable, WatchHistoryData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WatchHistoryTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _channelIdMeta =
      const VerificationMeta('channelId');
  @override
  late final GeneratedColumn<String> channelId = GeneratedColumn<String>(
      'channel_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _channelNameMeta =
      const VerificationMeta('channelName');
  @override
  late final GeneratedColumn<String> channelName = GeneratedColumn<String>(
      'channel_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _channelLogoMeta =
      const VerificationMeta('channelLogo');
  @override
  late final GeneratedColumn<String> channelLogo = GeneratedColumn<String>(
      'channel_logo', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _streamUrlMeta =
      const VerificationMeta('streamUrl');
  @override
  late final GeneratedColumn<String> streamUrl = GeneratedColumn<String>(
      'stream_url', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _watchedAtMeta =
      const VerificationMeta('watchedAt');
  @override
  late final GeneratedColumn<DateTime> watchedAt = GeneratedColumn<DateTime>(
      'watched_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [channelId, channelName, channelLogo, streamUrl, watchedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'watch_history';
  @override
  VerificationContext validateIntegrity(Insertable<WatchHistoryData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('channel_id')) {
      context.handle(_channelIdMeta,
          channelId.isAcceptableOrUnknown(data['channel_id']!, _channelIdMeta));
    } else if (isInserting) {
      context.missing(_channelIdMeta);
    }
    if (data.containsKey('channel_name')) {
      context.handle(
          _channelNameMeta,
          channelName.isAcceptableOrUnknown(
              data['channel_name']!, _channelNameMeta));
    } else if (isInserting) {
      context.missing(_channelNameMeta);
    }
    if (data.containsKey('channel_logo')) {
      context.handle(
          _channelLogoMeta,
          channelLogo.isAcceptableOrUnknown(
              data['channel_logo']!, _channelLogoMeta));
    }
    if (data.containsKey('stream_url')) {
      context.handle(_streamUrlMeta,
          streamUrl.isAcceptableOrUnknown(data['stream_url']!, _streamUrlMeta));
    } else if (isInserting) {
      context.missing(_streamUrlMeta);
    }
    if (data.containsKey('watched_at')) {
      context.handle(_watchedAtMeta,
          watchedAt.isAcceptableOrUnknown(data['watched_at']!, _watchedAtMeta));
    } else if (isInserting) {
      context.missing(_watchedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {channelId};
  @override
  WatchHistoryData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WatchHistoryData(
      channelId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_id'])!,
      channelName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_name'])!,
      channelLogo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_logo']),
      streamUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}stream_url'])!,
      watchedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}watched_at'])!,
    );
  }

  @override
  $WatchHistoryTable createAlias(String alias) {
    return $WatchHistoryTable(attachedDatabase, alias);
  }
}

class WatchHistoryData extends DataClass
    implements Insertable<WatchHistoryData> {
  final String channelId;
  final String channelName;
  final String? channelLogo;
  final String streamUrl;
  final DateTime watchedAt;
  const WatchHistoryData(
      {required this.channelId,
      required this.channelName,
      this.channelLogo,
      required this.streamUrl,
      required this.watchedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['channel_id'] = Variable<String>(channelId);
    map['channel_name'] = Variable<String>(channelName);
    if (!nullToAbsent || channelLogo != null) {
      map['channel_logo'] = Variable<String>(channelLogo);
    }
    map['stream_url'] = Variable<String>(streamUrl);
    map['watched_at'] = Variable<DateTime>(watchedAt);
    return map;
  }

  WatchHistoryCompanion toCompanion(bool nullToAbsent) {
    return WatchHistoryCompanion(
      channelId: Value(channelId),
      channelName: Value(channelName),
      channelLogo: channelLogo == null && nullToAbsent
          ? const Value.absent()
          : Value(channelLogo),
      streamUrl: Value(streamUrl),
      watchedAt: Value(watchedAt),
    );
  }

  factory WatchHistoryData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WatchHistoryData(
      channelId: serializer.fromJson<String>(json['channelId']),
      channelName: serializer.fromJson<String>(json['channelName']),
      channelLogo: serializer.fromJson<String?>(json['channelLogo']),
      streamUrl: serializer.fromJson<String>(json['streamUrl']),
      watchedAt: serializer.fromJson<DateTime>(json['watchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'channelId': serializer.toJson<String>(channelId),
      'channelName': serializer.toJson<String>(channelName),
      'channelLogo': serializer.toJson<String?>(channelLogo),
      'streamUrl': serializer.toJson<String>(streamUrl),
      'watchedAt': serializer.toJson<DateTime>(watchedAt),
    };
  }

  WatchHistoryData copyWith(
          {String? channelId,
          String? channelName,
          Value<String?> channelLogo = const Value.absent(),
          String? streamUrl,
          DateTime? watchedAt}) =>
      WatchHistoryData(
        channelId: channelId ?? this.channelId,
        channelName: channelName ?? this.channelName,
        channelLogo: channelLogo.present ? channelLogo.value : this.channelLogo,
        streamUrl: streamUrl ?? this.streamUrl,
        watchedAt: watchedAt ?? this.watchedAt,
      );
  WatchHistoryData copyWithCompanion(WatchHistoryCompanion data) {
    return WatchHistoryData(
      channelId: data.channelId.present ? data.channelId.value : this.channelId,
      channelName:
          data.channelName.present ? data.channelName.value : this.channelName,
      channelLogo:
          data.channelLogo.present ? data.channelLogo.value : this.channelLogo,
      streamUrl: data.streamUrl.present ? data.streamUrl.value : this.streamUrl,
      watchedAt: data.watchedAt.present ? data.watchedAt.value : this.watchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WatchHistoryData(')
          ..write('channelId: $channelId, ')
          ..write('channelName: $channelName, ')
          ..write('channelLogo: $channelLogo, ')
          ..write('streamUrl: $streamUrl, ')
          ..write('watchedAt: $watchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(channelId, channelName, channelLogo, streamUrl, watchedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WatchHistoryData &&
          other.channelId == this.channelId &&
          other.channelName == this.channelName &&
          other.channelLogo == this.channelLogo &&
          other.streamUrl == this.streamUrl &&
          other.watchedAt == this.watchedAt);
}

class WatchHistoryCompanion extends UpdateCompanion<WatchHistoryData> {
  final Value<String> channelId;
  final Value<String> channelName;
  final Value<String?> channelLogo;
  final Value<String> streamUrl;
  final Value<DateTime> watchedAt;
  final Value<int> rowid;
  const WatchHistoryCompanion({
    this.channelId = const Value.absent(),
    this.channelName = const Value.absent(),
    this.channelLogo = const Value.absent(),
    this.streamUrl = const Value.absent(),
    this.watchedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WatchHistoryCompanion.insert({
    required String channelId,
    required String channelName,
    this.channelLogo = const Value.absent(),
    required String streamUrl,
    required DateTime watchedAt,
    this.rowid = const Value.absent(),
  })  : channelId = Value(channelId),
        channelName = Value(channelName),
        streamUrl = Value(streamUrl),
        watchedAt = Value(watchedAt);
  static Insertable<WatchHistoryData> custom({
    Expression<String>? channelId,
    Expression<String>? channelName,
    Expression<String>? channelLogo,
    Expression<String>? streamUrl,
    Expression<DateTime>? watchedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (channelId != null) 'channel_id': channelId,
      if (channelName != null) 'channel_name': channelName,
      if (channelLogo != null) 'channel_logo': channelLogo,
      if (streamUrl != null) 'stream_url': streamUrl,
      if (watchedAt != null) 'watched_at': watchedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WatchHistoryCompanion copyWith(
      {Value<String>? channelId,
      Value<String>? channelName,
      Value<String?>? channelLogo,
      Value<String>? streamUrl,
      Value<DateTime>? watchedAt,
      Value<int>? rowid}) {
    return WatchHistoryCompanion(
      channelId: channelId ?? this.channelId,
      channelName: channelName ?? this.channelName,
      channelLogo: channelLogo ?? this.channelLogo,
      streamUrl: streamUrl ?? this.streamUrl,
      watchedAt: watchedAt ?? this.watchedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (channelId.present) {
      map['channel_id'] = Variable<String>(channelId.value);
    }
    if (channelName.present) {
      map['channel_name'] = Variable<String>(channelName.value);
    }
    if (channelLogo.present) {
      map['channel_logo'] = Variable<String>(channelLogo.value);
    }
    if (streamUrl.present) {
      map['stream_url'] = Variable<String>(streamUrl.value);
    }
    if (watchedAt.present) {
      map['watched_at'] = Variable<DateTime>(watchedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WatchHistoryCompanion(')
          ..write('channelId: $channelId, ')
          ..write('channelName: $channelName, ')
          ..write('channelLogo: $channelLogo, ')
          ..write('streamUrl: $streamUrl, ')
          ..write('watchedAt: $watchedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $EpgCacheTable extends EpgCache
    with TableInfo<$EpgCacheTable, EpgCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $EpgCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _channelIdMeta =
      const VerificationMeta('channelId');
  @override
  late final GeneratedColumn<String> channelId = GeneratedColumn<String>(
      'channel_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _startMeta = const VerificationMeta('start');
  @override
  late final GeneratedColumn<DateTime> start = GeneratedColumn<DateTime>(
      'start', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _endMeta = const VerificationMeta('end');
  @override
  late final GeneratedColumn<DateTime> end = GeneratedColumn<DateTime>(
      'end', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, channelId, title, start, end, description];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'epg_cache';
  @override
  VerificationContext validateIntegrity(Insertable<EpgCacheData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('channel_id')) {
      context.handle(_channelIdMeta,
          channelId.isAcceptableOrUnknown(data['channel_id']!, _channelIdMeta));
    } else if (isInserting) {
      context.missing(_channelIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('start')) {
      context.handle(
          _startMeta, start.isAcceptableOrUnknown(data['start']!, _startMeta));
    } else if (isInserting) {
      context.missing(_startMeta);
    }
    if (data.containsKey('end')) {
      context.handle(
          _endMeta, end.isAcceptableOrUnknown(data['end']!, _endMeta));
    } else if (isInserting) {
      context.missing(_endMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  EpgCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return EpgCacheData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      channelId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      start: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}start'])!,
      end: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}end'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description']),
    );
  }

  @override
  $EpgCacheTable createAlias(String alias) {
    return $EpgCacheTable(attachedDatabase, alias);
  }
}

class EpgCacheData extends DataClass implements Insertable<EpgCacheData> {
  final int id;
  final String channelId;
  final String title;
  final DateTime start;
  final DateTime end;
  final String? description;
  const EpgCacheData(
      {required this.id,
      required this.channelId,
      required this.title,
      required this.start,
      required this.end,
      this.description});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['channel_id'] = Variable<String>(channelId);
    map['title'] = Variable<String>(title);
    map['start'] = Variable<DateTime>(start);
    map['end'] = Variable<DateTime>(end);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    return map;
  }

  EpgCacheCompanion toCompanion(bool nullToAbsent) {
    return EpgCacheCompanion(
      id: Value(id),
      channelId: Value(channelId),
      title: Value(title),
      start: Value(start),
      end: Value(end),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
    );
  }

  factory EpgCacheData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return EpgCacheData(
      id: serializer.fromJson<int>(json['id']),
      channelId: serializer.fromJson<String>(json['channelId']),
      title: serializer.fromJson<String>(json['title']),
      start: serializer.fromJson<DateTime>(json['start']),
      end: serializer.fromJson<DateTime>(json['end']),
      description: serializer.fromJson<String?>(json['description']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'channelId': serializer.toJson<String>(channelId),
      'title': serializer.toJson<String>(title),
      'start': serializer.toJson<DateTime>(start),
      'end': serializer.toJson<DateTime>(end),
      'description': serializer.toJson<String?>(description),
    };
  }

  EpgCacheData copyWith(
          {int? id,
          String? channelId,
          String? title,
          DateTime? start,
          DateTime? end,
          Value<String?> description = const Value.absent()}) =>
      EpgCacheData(
        id: id ?? this.id,
        channelId: channelId ?? this.channelId,
        title: title ?? this.title,
        start: start ?? this.start,
        end: end ?? this.end,
        description: description.present ? description.value : this.description,
      );
  EpgCacheData copyWithCompanion(EpgCacheCompanion data) {
    return EpgCacheData(
      id: data.id.present ? data.id.value : this.id,
      channelId: data.channelId.present ? data.channelId.value : this.channelId,
      title: data.title.present ? data.title.value : this.title,
      start: data.start.present ? data.start.value : this.start,
      end: data.end.present ? data.end.value : this.end,
      description:
          data.description.present ? data.description.value : this.description,
    );
  }

  @override
  String toString() {
    return (StringBuffer('EpgCacheData(')
          ..write('id: $id, ')
          ..write('channelId: $channelId, ')
          ..write('title: $title, ')
          ..write('start: $start, ')
          ..write('end: $end, ')
          ..write('description: $description')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, channelId, title, start, end, description);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is EpgCacheData &&
          other.id == this.id &&
          other.channelId == this.channelId &&
          other.title == this.title &&
          other.start == this.start &&
          other.end == this.end &&
          other.description == this.description);
}

class EpgCacheCompanion extends UpdateCompanion<EpgCacheData> {
  final Value<int> id;
  final Value<String> channelId;
  final Value<String> title;
  final Value<DateTime> start;
  final Value<DateTime> end;
  final Value<String?> description;
  const EpgCacheCompanion({
    this.id = const Value.absent(),
    this.channelId = const Value.absent(),
    this.title = const Value.absent(),
    this.start = const Value.absent(),
    this.end = const Value.absent(),
    this.description = const Value.absent(),
  });
  EpgCacheCompanion.insert({
    this.id = const Value.absent(),
    required String channelId,
    required String title,
    required DateTime start,
    required DateTime end,
    this.description = const Value.absent(),
  })  : channelId = Value(channelId),
        title = Value(title),
        start = Value(start),
        end = Value(end);
  static Insertable<EpgCacheData> custom({
    Expression<int>? id,
    Expression<String>? channelId,
    Expression<String>? title,
    Expression<DateTime>? start,
    Expression<DateTime>? end,
    Expression<String>? description,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (channelId != null) 'channel_id': channelId,
      if (title != null) 'title': title,
      if (start != null) 'start': start,
      if (end != null) 'end': end,
      if (description != null) 'description': description,
    });
  }

  EpgCacheCompanion copyWith(
      {Value<int>? id,
      Value<String>? channelId,
      Value<String>? title,
      Value<DateTime>? start,
      Value<DateTime>? end,
      Value<String?>? description}) {
    return EpgCacheCompanion(
      id: id ?? this.id,
      channelId: channelId ?? this.channelId,
      title: title ?? this.title,
      start: start ?? this.start,
      end: end ?? this.end,
      description: description ?? this.description,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (channelId.present) {
      map['channel_id'] = Variable<String>(channelId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (start.present) {
      map['start'] = Variable<DateTime>(start.value);
    }
    if (end.present) {
      map['end'] = Variable<DateTime>(end.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('EpgCacheCompanion(')
          ..write('id: $id, ')
          ..write('channelId: $channelId, ')
          ..write('title: $title, ')
          ..write('start: $start, ')
          ..write('end: $end, ')
          ..write('description: $description')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $FavoritesTable favorites = $FavoritesTable(this);
  late final $WatchHistoryTable watchHistory = $WatchHistoryTable(this);
  late final $EpgCacheTable epgCache = $EpgCacheTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [favorites, watchHistory, epgCache];
}

typedef $$FavoritesTableCreateCompanionBuilder = FavoritesCompanion Function({
  required String channelId,
  required String channelName,
  Value<String?> channelLogo,
  required String streamUrl,
  required DateTime addedAt,
  Value<int> rowid,
});
typedef $$FavoritesTableUpdateCompanionBuilder = FavoritesCompanion Function({
  Value<String> channelId,
  Value<String> channelName,
  Value<String?> channelLogo,
  Value<String> streamUrl,
  Value<DateTime> addedAt,
  Value<int> rowid,
});

class $$FavoritesTableFilterComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get streamUrl => $composableBuilder(
      column: $table.streamUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get addedAt => $composableBuilder(
      column: $table.addedAt, builder: (column) => ColumnFilters(column));
}

class $$FavoritesTableOrderingComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get streamUrl => $composableBuilder(
      column: $table.streamUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get addedAt => $composableBuilder(
      column: $table.addedAt, builder: (column) => ColumnOrderings(column));
}

class $$FavoritesTableAnnotationComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get channelId =>
      $composableBuilder(column: $table.channelId, builder: (column) => column);

  GeneratedColumn<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => column);

  GeneratedColumn<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => column);

  GeneratedColumn<String> get streamUrl =>
      $composableBuilder(column: $table.streamUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get addedAt =>
      $composableBuilder(column: $table.addedAt, builder: (column) => column);
}

class $$FavoritesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $FavoritesTable,
    Favorite,
    $$FavoritesTableFilterComposer,
    $$FavoritesTableOrderingComposer,
    $$FavoritesTableAnnotationComposer,
    $$FavoritesTableCreateCompanionBuilder,
    $$FavoritesTableUpdateCompanionBuilder,
    (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
    Favorite,
    PrefetchHooks Function()> {
  $$FavoritesTableTableManager(_$AppDatabase db, $FavoritesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FavoritesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FavoritesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FavoritesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> channelId = const Value.absent(),
            Value<String> channelName = const Value.absent(),
            Value<String?> channelLogo = const Value.absent(),
            Value<String> streamUrl = const Value.absent(),
            Value<DateTime> addedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FavoritesCompanion(
            channelId: channelId,
            channelName: channelName,
            channelLogo: channelLogo,
            streamUrl: streamUrl,
            addedAt: addedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String channelId,
            required String channelName,
            Value<String?> channelLogo = const Value.absent(),
            required String streamUrl,
            required DateTime addedAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              FavoritesCompanion.insert(
            channelId: channelId,
            channelName: channelName,
            channelLogo: channelLogo,
            streamUrl: streamUrl,
            addedAt: addedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$FavoritesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $FavoritesTable,
    Favorite,
    $$FavoritesTableFilterComposer,
    $$FavoritesTableOrderingComposer,
    $$FavoritesTableAnnotationComposer,
    $$FavoritesTableCreateCompanionBuilder,
    $$FavoritesTableUpdateCompanionBuilder,
    (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
    Favorite,
    PrefetchHooks Function()>;
typedef $$WatchHistoryTableCreateCompanionBuilder = WatchHistoryCompanion
    Function({
  required String channelId,
  required String channelName,
  Value<String?> channelLogo,
  required String streamUrl,
  required DateTime watchedAt,
  Value<int> rowid,
});
typedef $$WatchHistoryTableUpdateCompanionBuilder = WatchHistoryCompanion
    Function({
  Value<String> channelId,
  Value<String> channelName,
  Value<String?> channelLogo,
  Value<String> streamUrl,
  Value<DateTime> watchedAt,
  Value<int> rowid,
});

class $$WatchHistoryTableFilterComposer
    extends Composer<_$AppDatabase, $WatchHistoryTable> {
  $$WatchHistoryTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get streamUrl => $composableBuilder(
      column: $table.streamUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get watchedAt => $composableBuilder(
      column: $table.watchedAt, builder: (column) => ColumnFilters(column));
}

class $$WatchHistoryTableOrderingComposer
    extends Composer<_$AppDatabase, $WatchHistoryTable> {
  $$WatchHistoryTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get streamUrl => $composableBuilder(
      column: $table.streamUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get watchedAt => $composableBuilder(
      column: $table.watchedAt, builder: (column) => ColumnOrderings(column));
}

class $$WatchHistoryTableAnnotationComposer
    extends Composer<_$AppDatabase, $WatchHistoryTable> {
  $$WatchHistoryTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get channelId =>
      $composableBuilder(column: $table.channelId, builder: (column) => column);

  GeneratedColumn<String> get channelName => $composableBuilder(
      column: $table.channelName, builder: (column) => column);

  GeneratedColumn<String> get channelLogo => $composableBuilder(
      column: $table.channelLogo, builder: (column) => column);

  GeneratedColumn<String> get streamUrl =>
      $composableBuilder(column: $table.streamUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get watchedAt =>
      $composableBuilder(column: $table.watchedAt, builder: (column) => column);
}

class $$WatchHistoryTableTableManager extends RootTableManager<
    _$AppDatabase,
    $WatchHistoryTable,
    WatchHistoryData,
    $$WatchHistoryTableFilterComposer,
    $$WatchHistoryTableOrderingComposer,
    $$WatchHistoryTableAnnotationComposer,
    $$WatchHistoryTableCreateCompanionBuilder,
    $$WatchHistoryTableUpdateCompanionBuilder,
    (
      WatchHistoryData,
      BaseReferences<_$AppDatabase, $WatchHistoryTable, WatchHistoryData>
    ),
    WatchHistoryData,
    PrefetchHooks Function()> {
  $$WatchHistoryTableTableManager(_$AppDatabase db, $WatchHistoryTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WatchHistoryTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WatchHistoryTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WatchHistoryTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> channelId = const Value.absent(),
            Value<String> channelName = const Value.absent(),
            Value<String?> channelLogo = const Value.absent(),
            Value<String> streamUrl = const Value.absent(),
            Value<DateTime> watchedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              WatchHistoryCompanion(
            channelId: channelId,
            channelName: channelName,
            channelLogo: channelLogo,
            streamUrl: streamUrl,
            watchedAt: watchedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String channelId,
            required String channelName,
            Value<String?> channelLogo = const Value.absent(),
            required String streamUrl,
            required DateTime watchedAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              WatchHistoryCompanion.insert(
            channelId: channelId,
            channelName: channelName,
            channelLogo: channelLogo,
            streamUrl: streamUrl,
            watchedAt: watchedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$WatchHistoryTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $WatchHistoryTable,
    WatchHistoryData,
    $$WatchHistoryTableFilterComposer,
    $$WatchHistoryTableOrderingComposer,
    $$WatchHistoryTableAnnotationComposer,
    $$WatchHistoryTableCreateCompanionBuilder,
    $$WatchHistoryTableUpdateCompanionBuilder,
    (
      WatchHistoryData,
      BaseReferences<_$AppDatabase, $WatchHistoryTable, WatchHistoryData>
    ),
    WatchHistoryData,
    PrefetchHooks Function()>;
typedef $$EpgCacheTableCreateCompanionBuilder = EpgCacheCompanion Function({
  Value<int> id,
  required String channelId,
  required String title,
  required DateTime start,
  required DateTime end,
  Value<String?> description,
});
typedef $$EpgCacheTableUpdateCompanionBuilder = EpgCacheCompanion Function({
  Value<int> id,
  Value<String> channelId,
  Value<String> title,
  Value<DateTime> start,
  Value<DateTime> end,
  Value<String?> description,
});

class $$EpgCacheTableFilterComposer
    extends Composer<_$AppDatabase, $EpgCacheTable> {
  $$EpgCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get start => $composableBuilder(
      column: $table.start, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get end => $composableBuilder(
      column: $table.end, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnFilters(column));
}

class $$EpgCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $EpgCacheTable> {
  $$EpgCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get start => $composableBuilder(
      column: $table.start, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get end => $composableBuilder(
      column: $table.end, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnOrderings(column));
}

class $$EpgCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $EpgCacheTable> {
  $$EpgCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get channelId =>
      $composableBuilder(column: $table.channelId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<DateTime> get start =>
      $composableBuilder(column: $table.start, builder: (column) => column);

  GeneratedColumn<DateTime> get end =>
      $composableBuilder(column: $table.end, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);
}

class $$EpgCacheTableTableManager extends RootTableManager<
    _$AppDatabase,
    $EpgCacheTable,
    EpgCacheData,
    $$EpgCacheTableFilterComposer,
    $$EpgCacheTableOrderingComposer,
    $$EpgCacheTableAnnotationComposer,
    $$EpgCacheTableCreateCompanionBuilder,
    $$EpgCacheTableUpdateCompanionBuilder,
    (EpgCacheData, BaseReferences<_$AppDatabase, $EpgCacheTable, EpgCacheData>),
    EpgCacheData,
    PrefetchHooks Function()> {
  $$EpgCacheTableTableManager(_$AppDatabase db, $EpgCacheTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$EpgCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$EpgCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$EpgCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> channelId = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<DateTime> start = const Value.absent(),
            Value<DateTime> end = const Value.absent(),
            Value<String?> description = const Value.absent(),
          }) =>
              EpgCacheCompanion(
            id: id,
            channelId: channelId,
            title: title,
            start: start,
            end: end,
            description: description,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String channelId,
            required String title,
            required DateTime start,
            required DateTime end,
            Value<String?> description = const Value.absent(),
          }) =>
              EpgCacheCompanion.insert(
            id: id,
            channelId: channelId,
            title: title,
            start: start,
            end: end,
            description: description,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$EpgCacheTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $EpgCacheTable,
    EpgCacheData,
    $$EpgCacheTableFilterComposer,
    $$EpgCacheTableOrderingComposer,
    $$EpgCacheTableAnnotationComposer,
    $$EpgCacheTableCreateCompanionBuilder,
    $$EpgCacheTableUpdateCompanionBuilder,
    (EpgCacheData, BaseReferences<_$AppDatabase, $EpgCacheTable, EpgCacheData>),
    EpgCacheData,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$FavoritesTableTableManager get favorites =>
      $$FavoritesTableTableManager(_db, _db.favorites);
  $$WatchHistoryTableTableManager get watchHistory =>
      $$WatchHistoryTableTableManager(_db, _db.watchHistory);
  $$EpgCacheTableTableManager get epgCache =>
      $$EpgCacheTableTableManager(_db, _db.epgCache);
}
