import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nself_auth_sdk/nself_auth_sdk.dart';

/// Authentication status exposed to the nTV UI.
enum AuthStatus { unknown, guest, authenticated }

/// Snapshot of authentication state used by the widget tree.
///
/// Mirrors the old bespoke type so callers require no changes.
/// Token storage and refresh are now owned by [NSelfAuth].
class AuthState {
  final AuthStatus status;
  final String? userEmail;

  const AuthState({required this.status, this.userEmail});

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.guest() : this(status: AuthStatus.guest);

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isGuest => status == AuthStatus.guest;

  /// Convenience: the current SDK access token (auto-refreshed).
  Future<String?> get accessToken => NSelfAuth.getAccessToken();
}

/// Manages nTV authentication via [NSelfAuth].
///
/// On app start, call [init] to restore any persisted session.
/// Tokens are stored in the platform secure store (Keychain / Keystore).
/// Biometric unlock is delegated to [NSelfAuth.unlockWithBiometrics].
class AuthService extends StateNotifier<AuthState> {
  /// Optional injected [StorageBackend] for tests.
  final StorageBackend? _testBackend;

  AuthService({StorageBackend? storageBackend})
      : _testBackend = storageBackend,
        super(const AuthState.unknown());

  /// Restore a persisted session (or set guest) on cold start.
  ///
  /// Must be called once from [main] before [runApp].
  Future<void> init({String authBaseUrl = 'https://nself.org/auth'}) async {
    await NSelfAuth.initialize(
      authBaseUrl: authBaseUrl,
      appVersion: '1.0.9',
      tokenStore: _testBackend != null
          ? TokenStore.withBackend(_testBackend!)
          : null,
    );

    final user = NSelfAuth.currentUser;
    if (user != null) {
      state = AuthState(
        status: AuthStatus.authenticated,
        userEmail: user.email,
      );
    } else {
      state = const AuthState.guest();
    }
  }

  /// Store tokens already received from an OAuth / SSO redirect.
  ///
  /// The caller passes [accessToken] + optional [refreshToken] and [email].
  /// Used when the nTV backend bundle handles the OAuth handshake externally.
  Future<void> storeTokens({
    required String accessToken,
    String? refreshToken,
    String? email,
  }) async {
    // Persist into SDK store for auto-refresh.
    final store = TokenStore.withBackend(
      _testBackend ?? InMemoryStorageBackend(),
    );
    await store.saveAccessToken(accessToken);
    if (refreshToken != null) await store.saveRefreshToken(refreshToken);
    state = AuthState(
      status: AuthStatus.authenticated,
      userEmail: email,
    );
  }

  /// Continue without a backend account (local M3U only).
  void continueAsGuest() => state = const AuthState.guest();

  /// Sign out via the SDK (clears tokens, unregisters device).
  Future<void> signOut() async {
    await NSelfAuth.signOut();
    state = const AuthState.guest();
  }

  // ── Biometric helpers (delegated to SDK) ──────────────────────────────────

  /// Returns true if biometric authentication is available on this device.
  Future<bool> isBiometricAvailable() => NSelfAuth.isBiometricAvailable();

  /// Enable biometric unlock for the current session.
  Future<void> enableBiometricUnlock() => NSelfAuth.enableBiometricUnlock();

  /// Restore the session via biometric prompt.
  ///
  /// Throws [BiometricUnavailableException] / [SessionExpiredException] on failure.
  Future<void> unlockWithBiometrics() async {
    final user = await NSelfAuth.unlockWithBiometrics();
    state = AuthState(
      status: AuthStatus.authenticated,
      userEmail: user?.email,
    );
  }
}

final authServiceProvider =
    StateNotifierProvider<AuthService, AuthState>((ref) => AuthService());
