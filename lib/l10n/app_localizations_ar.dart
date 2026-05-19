// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'nTV';

  @override
  String get navLibrary => 'المكتبة';

  @override
  String get navLiveTv => 'التلفاز المباشر';

  @override
  String get navGuide => 'الدليل';

  @override
  String get navSettings => 'الإعدادات';

  @override
  String get loading => 'جارٍ التحميل...';

  @override
  String get error => 'حدث خطأ ما';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get back => 'رجوع';

  @override
  String get play => 'تشغيل';

  @override
  String get pause => 'إيقاف مؤقت';

  @override
  String get search => 'بحث';

  @override
  String get searchMedia => 'البحث في الوسائط...';

  @override
  String get noResults => 'لا توجد نتائج.';

  @override
  String get noMedia => 'لا توجد وسائط.';

  @override
  String get noMediaSelected => 'لم يتم اختيار أي وسائط.';

  @override
  String get playerError => 'خطأ في التشغيل';

  @override
  String get configureBackend => 'تكوين الخادم الخلفي';

  @override
  String get mediaLibrary => 'مكتبة الوسائط';

  @override
  String get connectBackendHint => 'اتصل بخادم nSelf الخلفي لتصفح المحتوى.';
}
