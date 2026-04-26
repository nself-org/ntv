import 'dart:convert';

class User {
  final String id;
  final String email;
  final String displayName;
  final String tier;
  final List<String> activePlugins;
  final DateTime? accessTokenExpiry;

  User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.tier,
    required this.activePlugins,
    this.accessTokenExpiry,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'displayName': displayName,
    'tier': tier,
    'activePlugins': activePlugins,
    'accessTokenExpiry': accessTokenExpiry?.toIso8601String(),
  };

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'] as String,
    email: j['email'] as String,
    displayName: (j['displayName'] ?? j['display_name'] ?? '') as String,
    tier: (j['tier'] ?? 'free') as String,
    activePlugins: List<String>.from(
        (j['activePlugins'] ?? j['active_plugins'] ?? []) as List),
    accessTokenExpiry: j['accessTokenExpiry'] != null
        ? DateTime.parse(j['accessTokenExpiry'] as String) : null,
  );
}

abstract class StorageBackend {
  Future<String?> read(String key);
  Future<void> write(String key, String? value);
  Future<void> delete(String key);
}

class InMemoryStorageBackend implements StorageBackend {
  final Map<String, String> _data = {};
  @override Future<String?> read(String key) async => _data[key];
  @override Future<void> write(String key, String? value) async {
    if (value == null) { _data.remove(key); } else { _data[key] = value; }
  }
  @override Future<void> delete(String key) async => _data.remove(key);
}

class TokenStore {
  final StorageBackend _backend;
  TokenStore({required StorageBackend backend}) : _backend = backend;
  factory TokenStore.withBackend(StorageBackend backend) =>
      TokenStore(backend: backend);

  Future<void> saveUser(User user) =>
      _backend.write('nself_user_json', jsonEncode(user.toJson()));
  Future<void> saveAccessToken(String token) =>
      _backend.write('nself_access_token', token);
  Future<void> saveRefreshToken(String? token) async {}
  Future<User?> readUser() async {
    final raw = await _backend.read('nself_user_json');
    if (raw == null) return null;
    try { return User.fromJson(jsonDecode(raw) as Map<String, dynamic>); }
    catch (_) { return null; }
  }
  Future<String?> getAccessToken() => _backend.read('nself_access_token');
}

class NSelfAuth {
  static User? _currentUser;

  static Future<void> initialize({
    required String authBaseUrl,
    required String appVersion,
    TokenStore? tokenStore,
  }) async {
    _currentUser = null;
    if (tokenStore != null) {
      _currentUser = await tokenStore.readUser();
    }
  }

  static User? get currentUser => _currentUser;
  static Future<String?> getAccessToken() async => null;

  static Future<void> signOut() async { _currentUser = null; }
  static Future<bool> isBiometricAvailable() async => false;
  static Future<void> enableBiometricUnlock() async {}
  static Future<User?> unlockWithBiometrics() async {
    if (_currentUser == null) throw Exception('No active session');
    return _currentUser;
  }
  static void dispose() { _currentUser = null; }
}
