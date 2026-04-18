import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Keys used in SharedPreferences storage.
class _PrefKeys {
  static const backendUrl = 'ntv_backend_url';
  static const apiKey = 'ntv_api_key';
  static const autoplay = 'ntv_autoplay';
  static const preferredQuality = 'ntv_preferred_quality';
  static const m3uUrls = 'ntv_m3u_urls';
}

/// Persisted settings for nTV. Backed by SharedPreferences.
class SettingsService extends ChangeNotifier {
  String _backendUrl = '';
  String _apiKey = '';
  bool _autoplay = true;
  String _preferredQuality = 'auto';
  List<String> _m3uUrls = [];

  SharedPreferences? _prefs;

  String get backendUrl => _backendUrl;
  String get apiKey => _apiKey;
  bool get autoplay => _autoplay;
  String get preferredQuality => _preferredQuality;
  List<String> get m3uUrls => List.unmodifiable(_m3uUrls);
  bool get isConfigured => _backendUrl.isNotEmpty;

  /// Must be called once at app start before the service is used.
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _backendUrl = _prefs!.getString(_PrefKeys.backendUrl) ?? '';
    _apiKey = _prefs!.getString(_PrefKeys.apiKey) ?? '';
    _autoplay = _prefs!.getBool(_PrefKeys.autoplay) ?? true;
    _preferredQuality = _prefs!.getString(_PrefKeys.preferredQuality) ?? 'auto';
    _m3uUrls = _prefs!.getStringList(_PrefKeys.m3uUrls) ?? [];
    notifyListeners();
  }

  void setBackendUrl(String url) {
    _backendUrl = url;
    _prefs?.setString(_PrefKeys.backendUrl, url);
    notifyListeners();
  }

  void setApiKey(String key) {
    _apiKey = key;
    _prefs?.setString(_PrefKeys.apiKey, key);
    notifyListeners();
  }

  void setAutoplay(bool value) {
    _autoplay = value;
    _prefs?.setBool(_PrefKeys.autoplay, value);
    notifyListeners();
  }

  void setPreferredQuality(String quality) {
    _preferredQuality = quality;
    _prefs?.setString(_PrefKeys.preferredQuality, quality);
    notifyListeners();
  }

  void addM3uUrl(String url) {
    if (url.isEmpty || _m3uUrls.contains(url)) return;
    _m3uUrls = [..._m3uUrls, url];
    _prefs?.setStringList(_PrefKeys.m3uUrls, _m3uUrls);
    notifyListeners();
  }

  void removeM3uUrl(String url) {
    _m3uUrls = _m3uUrls.where((u) => u != url).toList();
    _prefs?.setStringList(_PrefKeys.m3uUrls, _m3uUrls);
    notifyListeners();
  }
}

final settingsServiceProvider =
    ChangeNotifierProvider<SettingsService>((ref) => SettingsService());
