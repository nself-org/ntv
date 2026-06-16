// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'Bibliothèque';

  @override
  String get navLiveTv => 'TV en direct';

  @override
  String get navGuide => 'Guide';

  @override
  String get navSettings => 'Paramètres';

  @override
  String get loading => 'Chargement...';

  @override
  String get error => 'Une erreur est survenue';

  @override
  String get retry => 'Réessayer';

  @override
  String get back => 'Retour';

  @override
  String get play => 'Lecture';

  @override
  String get pause => 'Pause';

  @override
  String get search => 'Rechercher';

  @override
  String get searchMedia => 'Rechercher du contenu...';

  @override
  String get noResults => 'Aucun résultat.';

  @override
  String get noMedia => 'Aucun contenu trouvé.';

  @override
  String get noMediaSelected => 'Aucun contenu sélectionné.';

  @override
  String get playerError => 'Erreur de lecture';

  @override
  String get configureBackend => 'Configurer le backend';

  @override
  String get mediaLibrary => 'Votre bibliothèque multimédia';

  @override
  String get connectBackendHint =>
      'Connectez-vous à votre backend nSelf pour parcourir le contenu.';
}
