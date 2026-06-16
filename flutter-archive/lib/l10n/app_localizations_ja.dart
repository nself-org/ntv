// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'ライブラリ';

  @override
  String get navLiveTv => 'ライブTV';

  @override
  String get navGuide => '番組表';

  @override
  String get navSettings => '設定';

  @override
  String get loading => '読み込み中...';

  @override
  String get error => 'エラーが発生しました';

  @override
  String get retry => '再試行';

  @override
  String get back => '戻る';

  @override
  String get play => '再生';

  @override
  String get pause => '一時停止';

  @override
  String get search => '検索';

  @override
  String get searchMedia => 'メディアを検索...';

  @override
  String get noResults => '結果が見つかりません。';

  @override
  String get noMedia => 'メディアが見つかりません。';

  @override
  String get noMediaSelected => 'メディアが選択されていません。';

  @override
  String get playerError => '再生エラー';

  @override
  String get configureBackend => 'バックエンドを設定';

  @override
  String get mediaLibrary => 'あなたのメディアライブラリ';

  @override
  String get connectBackendHint => 'コンテンツを閲覧するにはnSelfバックエンドに接続してください。';
}
