// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => '媒体库';

  @override
  String get navLiveTv => '直播TV';

  @override
  String get navGuide => '节目指南';

  @override
  String get navSettings => '设置';

  @override
  String get loading => '加载中...';

  @override
  String get error => '出现了问题';

  @override
  String get retry => '重试';

  @override
  String get back => '返回';

  @override
  String get play => '播放';

  @override
  String get pause => '暂停';

  @override
  String get search => '搜索';

  @override
  String get searchMedia => '搜索媒体...';

  @override
  String get noResults => '未找到结果。';

  @override
  String get noMedia => '未找到媒体。';

  @override
  String get noMediaSelected => '未选择媒体。';

  @override
  String get playerError => '播放错误';

  @override
  String get configureBackend => '配置后端';

  @override
  String get mediaLibrary => '您的媒体库';

  @override
  String get connectBackendHint => '连接到您的nSelf后端以浏览内容。';
}
