// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'Bibliothek';

  @override
  String get navLiveTv => 'Live-TV';

  @override
  String get navGuide => 'Programmführer';

  @override
  String get navSettings => 'Einstellungen';

  @override
  String get loading => 'Laden...';

  @override
  String get error => 'Etwas ist schiefgelaufen';

  @override
  String get retry => 'Erneut versuchen';

  @override
  String get back => 'Zurück';

  @override
  String get play => 'Abspielen';

  @override
  String get pause => 'Pausieren';

  @override
  String get search => 'Suchen';

  @override
  String get searchMedia => 'Medien suchen...';

  @override
  String get noResults => 'Keine Ergebnisse gefunden.';

  @override
  String get noMedia => 'Keine Medien gefunden.';

  @override
  String get noMediaSelected => 'Keine Medien ausgewählt.';

  @override
  String get playerError => 'Wiedergabefehler';

  @override
  String get configureBackend => 'Backend konfigurieren';

  @override
  String get mediaLibrary => 'Deine Medienbibliothek';

  @override
  String get connectBackendHint =>
      'Verbinde dich mit deinem nSelf-Backend, um Inhalte zu durchsuchen.';
}
