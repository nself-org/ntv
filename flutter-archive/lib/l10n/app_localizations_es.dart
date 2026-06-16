// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'Biblioteca';

  @override
  String get navLiveTv => 'TV en vivo';

  @override
  String get navGuide => 'Guía';

  @override
  String get navSettings => 'Configuración';

  @override
  String get loading => 'Cargando...';

  @override
  String get error => 'Algo salió mal';

  @override
  String get retry => 'Reintentar';

  @override
  String get back => 'Atrás';

  @override
  String get play => 'Reproducir';

  @override
  String get pause => 'Pausar';

  @override
  String get search => 'Buscar';

  @override
  String get searchMedia => 'Buscar contenido...';

  @override
  String get noResults => 'Sin resultados.';

  @override
  String get noMedia => 'No se encontró contenido.';

  @override
  String get noMediaSelected => 'Ningún contenido seleccionado.';

  @override
  String get playerError => 'Error de reproducción';

  @override
  String get configureBackend => 'Configurar backend';

  @override
  String get mediaLibrary => 'Tu biblioteca multimedia';

  @override
  String get connectBackendHint =>
      'Conéctate a tu backend nSelf para explorar contenido.';
}
