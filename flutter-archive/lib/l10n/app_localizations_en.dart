// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'Library';

  @override
  String get navLiveTv => 'Live TV';

  @override
  String get navGuide => 'Guide';

  @override
  String get navSettings => 'Settings';

  @override
  String get loading => 'Loading...';

  @override
  String get error => 'Something went wrong';

  @override
  String get retry => 'Retry';

  @override
  String get back => 'Back';

  @override
  String get play => 'Play';

  @override
  String get pause => 'Pause';

  @override
  String get search => 'Search';

  @override
  String get searchMedia => 'Search media...';

  @override
  String get noResults => 'No results found.';

  @override
  String get noMedia => 'No media found.';

  @override
  String get noMediaSelected => 'No media selected.';

  @override
  String get playerError => 'Playback error';

  @override
  String get configureBackend => 'Configure Backend';

  @override
  String get mediaLibrary => 'Your Media Library';

  @override
  String get connectBackendHint =>
      'Connect to your nSelf backend to browse content.';
}
